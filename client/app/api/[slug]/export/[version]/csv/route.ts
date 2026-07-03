import { StorageClient } from "@supabase/storage-js";
import type { NextRequest } from "next/server";
import z from "zod";
import { C, IS_RR_INSTANCE } from "~/helpers/constants.ts";
import type { OrganizationMetadata } from "~/helpers/types.ts";
import type { LatestPublicExportDetailsDto } from "~/helpers/validators/LatestPublicExportDetails.ts";
import { db } from "~/server/db/provider.ts";

export async function GET(req: NextRequest, { params }: RouteContext<"/api/[slug]/export/[version]/csv">) {
  if (!process.env.SERVICE_ROLE_KEY) {
    console.error("SERVICE_ROLE_KEY environment variable not set!");
    return new Response("Internal Server Error", { status: 500 });
  }
  if (!process.env.SUPABASE_STORAGE_URL) {
    console.error("SUPABASE_STORAGE_URL environment variable not set!");
    return new Response("Internal Server Error", { status: 500 });
  }
  if (!process.env.PUBLIC_EXPORTS_BUCKET_NAME) {
    console.error("PUBLIC_EXPORTS_BUCKET_NAME environment variable not set!");
    return new Response("Internal Server Error", { status: 500 });
  }

  const parsedParams = z
    .strictObject({ slug: z.string().nonempty(), version: z.enum(C.publicExportsFormatVersions) })
    .safeParse(await params);
  if (!parsedParams.success) return new Response(`Validation error: ${parsedParams.error}`, { status: 400 });
  const { slug, version: exportFormatVersion } = parsedParams.data;
  const searchParams = req.nextUrl.searchParams;

  const organization = await db.query.organizations.findFirst({
    columns: { metadata: true },
    with: { subscription: { columns: { plan: true }, where: { status: { in: ["active", "trialing"] } } } },
    where: { slug },
  });
  if (!organization?.metadata) return new Response("Space not found", { status: 404 });
  if (IS_RR_INSTANCE) {
    if (!organization.subscription)
      return new Response("There is no active subscription for this space", { status: 400 });
    if (organization.subscription.plan === "basic")
      return new Response("Basic plan spaces don't have automated public exports", { status: 400 });
  }
  const metadata = JSON.parse(organization.metadata) as OrganizationMetadata;
  if (metadata.private) return new Response("Private spaces don't have automated public exports", { status: 400 });

  const storageClient = new StorageClient(process.env.SUPABASE_STORAGE_URL, {
    apikey: process.env.SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SERVICE_ROLE_KEY}`,
  });

  // Get contents of the directory with the exports for the given version and organization slug
  const exportsDirectory = `${exportFormatVersion}/${slug}`;
  const { data, error } = await storageClient.from(process.env.PUBLIC_EXPORTS_BUCKET_NAME).list(exportsDirectory);
  if (error) return new Response(`Error while fetching list of export files: ${error.message}`, { status: 500 });
  if (data.length === 0) return new Response("No public exports have been generated yet", { status: 500 });

  const latestExport = data.at(-1)!;
  const filePath = `${exportsDirectory}/${latestExport.name}`;
  if (!latestExport.created_at)
    return new Response("Date of creation not found. Please contact the admin team.", { status: 500 });

  if (searchParams.get("metadataOnly") === "true") {
    // Respond with the metadata of the latest export
    const {
      data: { publicUrl },
    } = await storageClient.from(process.env.PUBLIC_EXPORTS_BUCKET_NAME).getPublicUrl(filePath);

    return Response.json(
      {
        publicUrl,
        fileName: latestExport.name,
        exportDate: latestExport.created_at,
      } satisfies LatestPublicExportDetailsDto,
      { status: 200 },
    );
  } else {
    // Respond with the blob of the latest export
    const { data, error } = await storageClient.from(process.env.PUBLIC_EXPORTS_BUCKET_NAME).download(filePath);
    if (error) return new Response(`Error while fetching export file: ${error.message}`, { status: 500 });

    return new Response(data, { status: 200 });
  }
}
