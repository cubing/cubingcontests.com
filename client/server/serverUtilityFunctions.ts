import "server-only";
import { and, desc, eq, inArray, isNull, lte, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Continents, Countries } from "~/helpers/Countries.ts";
import { type RecordCategory, type RecordType, RecordTypeValues } from "~/helpers/types.ts";
import { getDateOnly, getNameAndLocalizedName } from "../helpers/sharedFunctions.ts";
import { auth } from "./auth.ts";
import { db } from "./db/provider.ts";
import { eventsPublicCols, eventsTable } from "./db/schema/events.ts";
import { personsTable, type SelectPerson } from "./db/schema/persons.ts";
import { recordConfigsPublicCols, recordConfigsTable } from "./db/schema/record-configs.ts";
import { resultsTable, type SelectResult } from "./db/schema/results.ts";
import type { CcPermissions } from "./permissions.ts";
import { CcActionError } from "./safeAction.ts";

export async function checkUserPermissions(userId: string, permissions: CcPermissions) {
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
    countryIso2,
  }: { recordsUpTo?: Date; excludeResultId?: number; countryIso2?: string } = {
    recordsUpTo: getDateOnly(new Date())!,
  },
): Promise<SelectResult | undefined> {
  const recordField = bestOrAverage === "best" ? "regionalSingleRecord" : "regionalAverageRecord";
  const continent = Continents.find((c) => c.recordTypeId === recordType);
  const country = countryIso2 ? Countries.find((c) => c.code === countryIso2) : undefined;
  let recordTypeCondition: any;

  if (recordType === "WR") recordTypeCondition = eq(resultsTable[recordField], "WR");
  else if (continent) recordTypeCondition = inArray(resultsTable[recordField], [recordType, "WR"]);
  else if (country) {
    const crType = Continents.find((c) => c.code === country.continentId)!.recordTypeId;
    recordTypeCondition = inArray(resultsTable[recordField], ["NR", crType, "WR"]);
  } else throw new Error(`Country ${countryIso2} not found!`);

  const [recordResult] = await db
    .select()
    .from(resultsTable)
    .where(
      and(
        isNull(resultsTable.competitionId),
        eq(resultsTable.eventId, eventId),
        excludeResultId ? ne(resultsTable.id, excludeResultId) : undefined,
        lte(resultsTable.date, recordsUpTo),
        recordTypeCondition,
        continent ? eq(resultsTable.continentId, continent.code) : undefined,
        countryIso2 ? eq(resultsTable.countryIso2, countryIso2) : undefined,
      ),
    )
    .orderBy(desc(resultsTable.date))
    .limit(1);

  return recordResult;
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
            !ignoredWcaMatches.includes(wcaPerson.wca_id) &&
            name === person.name &&
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
    const [updatedPerson] = await db
      .update(personsTable)
      .set(updatePersonObject)
      .where(eq(personsTable.id, person.id))
      .returning();
    return updatedPerson;
  }

  return person;
}
