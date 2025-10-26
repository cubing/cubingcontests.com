import "server-only";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "./auth.ts";
import { CcPermissions } from "./permissions.ts";
import type { EventWrPair, RecordCategory } from "~/helpers/types.ts";
import { db } from "./db/provider.ts";
import { RecordConfigResponse, recordConfigsPublicCols, recordConfigsTable } from "./db/schema/record-configs.ts";
import { and, eq, sql } from "drizzle-orm";
import { eventsTable } from "./db/schema/events.ts";
import { resultsTable } from "./db/schema/results.ts";
import { getDateOnly, getNameAndLocalizedName } from "../helpers/sharedFunctions.ts";
import { personsTable, SelectPerson } from "./db/schema/persons.ts";
import { CcActionError } from "./safeAction.ts";

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

export async function getActiveRecordConfigs(recordFor: RecordCategory) {
  return await db.select(recordConfigsPublicCols).from(recordConfigsTable).where(
    and(eq(recordConfigsTable.active, true), eq(recordConfigsTable.category, recordFor)),
  );
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

  const wrPairs = (await db.execute<{
    event_id: string;
    best: string | null;
    average: string | null;
  }>(sql`SELECT ${eventsTable.eventId},
(SELECT ${resultsTable.best} FROM ${resultsTable} WHERE ${resultsTable.competitionId} IS NULL
  AND 'WR' = ANY(${resultsTable.singleRecordTypes})
  AND ${resultsTable.id} <> ${excludeResultId}
  AND ${resultsTable.eventId} = ${eventsTable.eventId}
  AND ${resultsTable.date} <= ${recordsUpTo}
  ORDER BY ${resultsTable.date} DESC LIMIT 1) AS best,
(SELECT ${resultsTable.average} FROM ${resultsTable} WHERE ${resultsTable.competitionId} IS NULL
  AND 'WR' = ANY(${resultsTable.averageRecordTypes})
  AND ${resultsTable.id} <> ${excludeResultId}
  AND ${resultsTable.eventId} = ${eventsTable.eventId}
  AND ${resultsTable.date} <= ${recordsUpTo}
  ORDER BY ${resultsTable.date} DESC LIMIT 1) AS average
FROM ${eventsTable} WHERE ${eventsTable.submissionsAllowed} IS TRUE;`))
    .rows;

  return wrPairs.map((ewp) => ({
    eventId: ewp.event_id,
    best: ewp.best ? parseInt(ewp.best) : -1,
    average: ewp.average ? parseInt(ewp.average) : -1,
  }));
}

export async function setPersonToApproved(
  person: SelectPerson,
  { requireWcaId, ignoredWcaMatches = [] }: { requireWcaId: boolean; ignoredWcaMatches?: string[] },
): Promise<SelectPerson> {
  const updatePersonObject: Partial<SelectPerson> = {};

  if (!person.wcaId) {
    const res = await fetch(
      `https://www.worldcubeassociation.org/api/v0/search/users?persons_table=true&q=${person.name}`,
    );
    if (res.ok) {
      const { result: wcaPersons } = await res.json();

      if (!requireWcaId) {
        for (const wcaPerson of wcaPersons) {
          const { name } = getNameAndLocalizedName(wcaPerson.name);

          if (
            !ignoredWcaMatches.includes(wcaPerson.wca_id) && name === person.name &&
            wcaPerson.country_iso2 === person.countryIso2
          ) {
            throw new CcActionError(
              `There is an exact name and country match with the WCA competitor with WCA ID ${wcaPerson.wca_id}. If that is the same person, edit their profile, adding the WCA ID. If it's a different person, simply approve them again to confirm.`,
              { data: { wcaMatches: [...ignoredWcaMatches, wcaPerson.wca_id] } },
            );
          }
        }
      } else if (wcaPersons?.length === 1) {
        const wcaPerson = wcaPersons[0];
        const { name, localizedName } = getNameAndLocalizedName(wcaPerson.name);

        if (name === person.name && wcaPerson.country_iso2 === person.countryIso2) {
          updatePersonObject.wcaId = wcaPerson.wca_id;
          if (localizedName) updatePersonObject.localizedName = localizedName;
        }
      }
    }
  }

  if (!requireWcaId || person.wcaId) {
    console.log(`Approving person ${person.name} (CC ID: ${person.personId})`);

    updatePersonObject.approved = true;
  }

  if (Object.keys(updatePersonObject).length > 0) {
    const [updatedPerson] = await db.update(personsTable).set(updatePersonObject)
      .where(eq(personsTable.id, person.id))
      .returning();
    return updatedPerson;
  }

  return person;
}
