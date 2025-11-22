"use server";

import { and, arrayContains, desc, eq } from "drizzle-orm";
import z from "zod";
import { personsTable } from "~/server/db/schema/persons.ts";
import { db } from "../db/provider.ts";
import { type ContestResponse, contestsPublicCols, contestsTable as table } from "../db/schema/contests.ts";
import { actionClient, CcActionError } from "../safeAction.ts";

export const getModContestsSF = actionClient
  .metadata({ permissions: { modDashboard: ["view"] } })
  .inputSchema(
    z.strictObject({
      organizerPersonId: z.int().optional(),
    }),
  )
  .action<ContestResponse[]>(async ({ parsedInput: { organizerPersonId }, ctx: { session } }) => {
    const queryFilters = [];
    let query: any = db.select(contestsPublicCols).from(table);

    // If it's a moderator, only get their own contests
    if (session.user.role !== "admin") {
      const msg = "Your competitor profile must be tied to your account before you can use moderator features";
      if (!session.user.personId) throw new CcActionError(msg);

      const [userPerson] = await db
        .select({ id: personsTable.id })
        .from(personsTable)
        .where(eq(personsTable.personId, session.user.personId));

      if (!userPerson) throw new CcActionError(msg);
      queryFilters.push(arrayContains(table.organizers, [userPerson.id]));
    }

    if (organizerPersonId) {
      const [organizerPerson] = await db
        .select({ id: personsTable.id })
        .from(personsTable)
        .where(eq(personsTable.personId, organizerPersonId));

      if (!organizerPerson) throw new CcActionError(`Person with ID ${organizerPersonId} not found`);
      console.log(organizerPerson);
      queryFilters.push(arrayContains(table.organizers, [organizerPerson.id]));
    }

    if (queryFilters.length > 0) query = query.where(and(...queryFilters));

    const contests = await query.orderBy(desc(table.startDate));
    return contests;
  });
