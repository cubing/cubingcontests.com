import "server-only";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "./auth.ts";
import { CcPermissions } from "./permissions.ts";
import type { EventWrPair } from "~/helpers/types.ts";
import { db } from "./db/provider.ts";
import { RecordConfigResponse, recordConfigsPublicCols, recordConfigsTable } from "./db/schema/record-configs.ts";
import { eq, sql } from "drizzle-orm";
import { eventsTable } from "./db/schema/events.ts";
import { resultsTable } from "./db/schema/results.ts";
import { getDateOnly } from "../helpers/sharedFunctions.ts";

export async function checkUserPermissions(userId: string, permissions: CcPermissions) {
  const { success } = await auth.api.userHasPermission({ body: { userId, permissions } });
  return success;
}

export async function authorizeUser({ permissions }: { permissions?: CcPermissions } = {}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  if (permissions) {
    const isAuthorized = await checkUserPermissions(session.user.id, permissions);

    if (!isAuthorized) redirect("/login");
  }

  return session;
}

export async function getWrPairs(
  {
    recordsUpTo = getDateOnly(new Date())!,
    excludeResultId = 0,
    wrRecordConfig,
  }: {
    recordsUpTo?: Date;
    excludeResultId?: number;
    wrRecordConfig?: RecordConfigResponse;
  } = { recordsUpTo: getDateOnly(new Date())!, excludeResultId: 0 },
): Promise<EventWrPair[]> {
  if (!wrRecordConfig) {
    wrRecordConfig = (await db.select(recordConfigsPublicCols).from(recordConfigsTable)
      .where(eq(recordConfigsTable.recordTypeId, "WR")))
      .at(0);
  }

  const eventWrPairs = (await db.execute<{
    event_id: string;
    best: string | null;
    average: string | null;
  }>(sql`SELECT ${eventsTable.eventId},
(SELECT ${resultsTable.best} FROM ${resultsTable} WHERE ${resultsTable.best} > 0
  AND ${resultsTable.id} <> ${excludeResultId}
  AND ${resultsTable.eventId} = ${eventsTable.eventId}
  AND ${resultsTable.date} <= ${recordsUpTo}
  ORDER BY best LIMIT 1) AS best,
(SELECT ${resultsTable.average} FROM ${resultsTable} WHERE ${resultsTable.average} > 0
  AND ${resultsTable.id} <> ${excludeResultId}
  AND ${resultsTable.eventId} = ${eventsTable.eventId}
  AND ${resultsTable.date} <= ${recordsUpTo}
  AND ((${eventsTable.defaultRoundFormat} = 'a' AND CARDINALITY(${resultsTable.attempts}) = 5)
    OR (${eventsTable.defaultRoundFormat} <> 'a' AND CARDINALITY(${resultsTable.attempts}) = 3)
  ) ORDER BY average LIMIT 1) AS average
FROM ${eventsTable} WHERE ${eventsTable.submissionsAllowed} IS TRUE;`))
    .rows;

  return eventWrPairs.map((ewp) => ({
    eventId: ewp.event_id,
    best: ewp.best ? parseInt(ewp.best) : -1,
    average: ewp.average ? parseInt(ewp.average) : -1,
  }));
}

export async function approvePersons({
  personIds,
  // competitionId,
  requireWcaId = false,
}: {
  personIds?: number[];
  // competitionId?: string;
  requireWcaId?: boolean;
}) {
  // const persons = personIds
  //   ? await this.getPersonsByPersonIds(personIds, { unapprovedOnly: true })
  //   : await this.getContestParticipants({
  //     competitionId,
  //     unapprovedOnly: true,
  //   });
  // const message = competitionId
  //   ? `Approving unapproved persons from contest with ID ${competitionId}`
  //   : `Approving persons with person IDs: ${personIds.join(", ")}`;

  // this.logger.logAndSave(message, LogType.ApprovePersons);

  await Promise.allSettled(
    persons.filter((p) => p.unapproved).map((p) => this.setPersonToApproved(p, requireWcaId)),
  );
}
