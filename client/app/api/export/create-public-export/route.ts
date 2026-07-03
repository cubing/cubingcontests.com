import { StorageClient } from "@supabase/storage-js";
import { format } from "date-fns";
import { and, eq, notInArray } from "drizzle-orm";
import JSZip from "jszip";
import type { NextRequest } from "next/server";
import { C } from "~/helpers/constants.ts";
import { generateCsv } from "~/helpers/utility-functions.ts";
import { db } from "~/server/db/provider.ts";
import { contestsPublicCols, contestsTable } from "~/server/db/schema/contests.ts";
import { eventsPublicCols, eventsTable } from "~/server/db/schema/events.ts";
import { personsPublicCols, personsTable } from "~/server/db/schema/persons.ts";
import { resultsPublicCols, resultsTable } from "~/server/db/schema/results.ts";
import { roundsPublicCols, roundsTable } from "~/server/db/schema/rounds.ts";
import { getSettingFromDb } from "~/server/server-only-functions.ts";

export async function POST(req: NextRequest) {
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
  if (!process.env.NEXT_PUBLIC_PROJECT_NAME) {
    console.error("NEXT_PUBLIC_PROJECT_NAME environment variable not set!");
    return new Response("Internal Server Error", { status: 500 });
  }

  const [publicExportsToKeep, publicExportsReadme] = await Promise.all([
    getSettingFromDb({ key: "public-exports-to-keep", organizationId: null }),
    getSettingFromDb({ key: "public-exports-readme", organizationId: null }),
  ]);
  if (publicExportsToKeep === "0") return new Response("Public exports are disabled", { status: 500 });

  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token || token !== process.env.SERVICE_ROLE_KEY) return new Response("Unauthorized", { status: 401 });

  const storageClient = new StorageClient(process.env.SUPABASE_STORAGE_URL, {
    apikey: process.env.SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SERVICE_ROLE_KEY}`,
  });
  const { data, error } = await storageClient.listBuckets();
  if (error) return new Response(`Error while fetching list of buckets: ${error.message}`, { status: 500 });

  // Create bucket for public exports if it doesn't exist
  if (!data.some((bucket) => bucket.name === process.env.PUBLIC_EXPORTS_BUCKET_NAME)) {
    await storageClient.createBucket(process.env.PUBLIC_EXPORTS_BUCKET_NAME, {
      public: true,
      allowedMimeTypes: ["application/zip"],
    });
    console.log(`Created storage bucket "${process.env.PUBLIC_EXPORTS_BUCKET_NAME}"`);
  }

  const exportFormatVersion = C.publicExportsFormatVersions.at(-1);
  const organizations = await db.query.organizations.findMany({
    columns: { id: true, slug: true, name: true },
  });

  for (const { id, slug, name } of organizations) {
    let existingExports: string[] | undefined;
    const exportsDirectory = `${exportFormatVersion}/${slug}`;

    // Get contents of the directory with the exports for the given version and organization, to delete the oldest
    // archives at the end (it's assumed the files are returned already sorted by date)
    const { data, error } = await storageClient.from(process.env.PUBLIC_EXPORTS_BUCKET_NAME).list(exportsDirectory);
    if (error) return new Response(`Error while fetching list of export files: ${error.message}`, { status: 500 });

    if (data.length > 0) existingExports = data.map((file) => `${exportFormatVersion}/${file.name}`);

    // Generate export archive
    const zip = new JSZip();
    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");

    zip.file(
      "metadata.json",
      JSON.stringify({ export_format_version: exportFormatVersion, export_date: timestamp.split("_").at(0) }, null, 2),
    );

    zip.file("README.md", publicExportsReadme);

    const eventsCsv = generateCsv(
      await db
        .select({
          ...eventsPublicCols,
          rule: eventsTable.rule,
          createdAt: eventsTable.createdAt,
          updatedAt: eventsTable.updatedAt,
        })
        .from(eventsTable)
        .where(eq(eventsTable.organizationId, id))
        .orderBy(eventsTable.id),
    );
    zip.file("export_events.csv", eventsCsv);

    const personsCsv = generateCsv(
      await db
        .select({ ...personsPublicCols, createdAt: personsTable.createdAt, updatedAt: personsTable.updatedAt })
        .from(personsTable)
        .where(eq(personsTable.organizationId, id))
        .orderBy(personsTable.id),
    );
    zip.file("export_persons.csv", personsCsv);

    const contestsFilter = notInArray(contestsTable.state, ["created", "removed"]);
    const contestsCsv = generateCsv(
      await db
        .select({
          ...contestsPublicCols,
          schedule: contestsTable.schedule,
          createdAt: contestsTable.createdAt,
          updatedAt: contestsTable.updatedAt,
        })
        .from(contestsTable)
        .where(and(eq(contestsTable.organizationId, id), contestsFilter))
        .orderBy(contestsTable.id),
    );
    zip.file("export_contests.csv", contestsCsv);

    const roundsCsv = generateCsv(
      await db
        .select({ ...roundsPublicCols, createdAt: roundsTable.createdAt, updatedAt: roundsTable.updatedAt })
        .from(roundsTable)
        .leftJoin(
          contestsTable,
          and(
            eq(roundsTable.organizationId, contestsTable.organizationId),
            eq(roundsTable.competitionId, contestsTable.competitionId),
          ),
        )
        .where(and(eq(roundsTable.organizationId, id), contestsFilter))
        .orderBy(roundsTable.id),
    );
    zip.file("export_rounds.csv", roundsCsv);

    const resultsCsv = generateCsv(
      await db
        .select({ ...resultsPublicCols, createdAt: resultsTable.createdAt, updatedAt: resultsTable.updatedAt })
        .from(resultsTable)
        .where(eq(resultsTable.organizationId, id))
        .orderBy(resultsTable.id),
    );
    zip.file("export_results.csv", resultsCsv);

    const blob = await zip.generateAsync({ type: "blob" });

    // Save export archive in Supabase storage
    const cleanOrgName = name.replace(/[^a-zA-Z0-9]/g, "");
    const randomString = crypto.randomUUID().split("-").at(0);
    const filePath = `${exportsDirectory}/${cleanOrgName}_export_${exportFormatVersion}_${timestamp}_${randomString}.zip`;

    const { error: error2 } = await storageClient.from(process.env.PUBLIC_EXPORTS_BUCKET_NAME).upload(filePath, blob);
    if (error2) return new Response(`Error while uploading file: ${error2.message}`, { status: 500 });

    // Delete oldest export(s)
    const exportsToKeep = parseInt(publicExportsToKeep, 10);
    if (existingExports && existingExports.length + 1 > exportsToKeep) {
      const { error } = await storageClient
        .from(process.env.PUBLIC_EXPORTS_BUCKET_NAME)
        .remove(existingExports.slice(0, existingExports.length + 1 - exportsToKeep));
      if (error) return new Response(`Error while deleting oldest export: ${error.message}`, { status: 500 });
    }
  }

  return Response.json({}, { status: 200 });
}
