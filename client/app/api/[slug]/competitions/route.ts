import type { NextRequest } from "next/server";
import z from "zod";
import { db } from "~/server/db/provider.ts";
import { getContests } from "~/server/server-only-functions/contests-functions.ts";

export async function GET(req: NextRequest, { params }: RouteContext<"/api/[slug]/competitions">) {
  const searchParams = req.nextUrl.searchParams;
  const parsedParams = z.strictObject({ slug: z.string().nonempty() }).safeParse(await params);
  if (!parsedParams.success) return new Response(`Validation error: ${parsedParams.error}`, { status: 400 });

  const organization = await db.query.organizations.findFirst({
    columns: { id: true },
    where: { slug: parsedParams.data.slug },
  });
  if (!organization) return new Response("Space not found", { status: 404 });

  const regionCode = searchParams.get("region");
  const region = regionCode ? await db.query.regions.findFirst({ where: { code: regionCode } }) : undefined;
  if (regionCode && !region) return new Response("Region not found", { status: 400 });

  const contests = await getContests({
    organizationId: organization.id,
    eventId: searchParams.get("eventId") || undefined,
    region,
  });

  return Response.json(contests, { status: 200 });
}
