import "server-only";
import { and, desc, eq, inArray, lte, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Continents, Countries } from "~/helpers/Countries.ts";
import { type RecordCategory, type RecordType, RecordTypeValues } from "~/helpers/types.ts";
import { getIsAdmin } from "~/helpers/utilityFunctions.ts";
import { getDateOnly } from "../helpers/sharedFunctions.ts";
import { auth } from "./auth.ts";
import { db } from "./db/provider.ts";
import { eventsPublicCols, eventsTable } from "./db/schema/events.ts";
import { recordConfigsPublicCols, recordConfigsTable } from "./db/schema/record-configs.ts";
import { resultsTable, type SelectResult } from "./db/schema/results.ts";
import type { CcPermissions } from "./permissions.ts";

export async function checkUserPermissions(userId: string, permissions: CcPermissions): Promise<boolean> {
  const { success } = await auth.api.userHasPermission({ body: { userId, permissions } });
  return success;
}

export async function authorizeUser({
  permissions,
}: {
  permissions?: CcPermissions;
} = {}): Promise<typeof auth.$Infer.Session> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  if (permissions) {
    const isAuthorized = await checkUserPermissions(session.user.id, permissions);
    if (!isAuthorized) redirect("/login");

    // The user must have an assigned person to be able to do any operation except creating video-based results
    if (
      !session.user.personId &&
      (Object.keys(permissions).some((key) => key !== ("videoBasedResults" satisfies keyof typeof permissions)) ||
        permissions.videoBasedResults?.some((perm) => perm !== "create"))
    )
      redirect("/login");
  }

  return session;
}

export async function getRecordConfigs(recordFor: RecordCategory) {
  const recordConfigs = await db
    .select(recordConfigsPublicCols)
    .from(recordConfigsTable)
    .where(eq(recordConfigsTable.category, recordFor));

  if (recordConfigs.length !== RecordTypeValues.length) {
    throw new Error(
      `The records are configured incorrectly. Expected ${RecordTypeValues.length} record configs for the category, but found ${recordConfigs.length}.`,
    );
  }

  return recordConfigs;
}

export async function getVideoBasedEvents() {
  const events = await db
    .select(eventsPublicCols)
    .from(eventsTable)
    .where(eq(eventsTable.submissionsAllowed, true))
    .orderBy(eventsTable.rank);

  return events;
}

export async function getRecordResult(
  eventId: string,
  bestOrAverage: "best" | "average",
  recordType: RecordType,
  recordCategory: RecordCategory,
  {
    recordsUpTo = getDateOnly(new Date())!,
    excludeResultId,
    regionCode,
  }: { recordsUpTo?: Date; excludeResultId?: number; regionCode?: string } = {
    recordsUpTo: getDateOnly(new Date())!,
  },
): Promise<SelectResult | undefined> {
  const recordField = bestOrAverage === "best" ? "regionalSingleRecord" : "regionalAverageRecord";
  const superRegion = Continents.find((c) => c.recordTypeId === recordType);
  const region = regionCode ? Countries.find((c) => c.code === regionCode) : undefined;
  const recordTypes: RecordType[] = [];

  if (recordType === "WR") {
    recordTypes.push("WR");
  } else if (superRegion) {
    recordTypes.push(recordType, "WR");
  } else if (region) {
    const crType = Continents.find((c) => c.code === region.superRegionCode)!.recordTypeId;
    recordTypes.push("NR", crType, "WR");
  } else {
    throw new Error(`Unknown region code: ${regionCode}`);
  }

  const [recordResult] = await db
    .select()
    .from(resultsTable)
    .where(
      and(
        eq(resultsTable.eventId, eventId),
        excludeResultId ? ne(resultsTable.id, excludeResultId) : undefined,
        lte(resultsTable.date, recordsUpTo),
        eq(resultsTable.recordCategory, recordCategory),
        inArray(resultsTable[recordField], recordTypes),
        superRegion ? eq(resultsTable.superRegionCode, superRegion.code) : undefined,
        regionCode ? eq(resultsTable.regionCode, regionCode) : undefined,
      ),
    )
    .orderBy(desc(resultsTable.date))
    .limit(1);
  return recordResult;
}

export function getUserHasAccessToContest(user: typeof auth.$Infer.Session.user, organizerIds: number[]) {
  return user.personId && (getIsAdmin(user.role) || organizerIds.includes(user.personId));
}
