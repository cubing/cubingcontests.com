"use server";

import { and, eq, ilike, ne, or, sql } from "drizzle-orm";
import { fetchWcaPerson, getNameAndLocalizedName, getSimplifiedString } from "~/helpers/sharedFunctions.ts";
import { WcaPersonDto } from "~/helpers/types.ts";
import { db } from "~/server/db/provider.ts";
import { PersonResponse, personsPublicCols, personsTable as table } from "~/server/db/schema/persons.ts";
import { actionClient, CcActionError } from "../safeAction.ts";
import { z } from "zod";
import { checkUserPermissions } from "../serverUtilityFunctions.ts";
import { WcaIdValidator } from "~/helpers/validators/Validators.ts";
import { PersonDto, PersonValidator } from "~/helpers/validators/Person.ts";
import { usersTable } from "../db/schema/auth-schema.ts";
import { C } from "~/helpers/constants.ts";

export const getPersonsByNameSF = actionClient.metadata({ permissions: null })
  .inputSchema(z.strictObject({
    name: z.string().max(60),
  })).action<PersonResponse[]>(async ({ parsedInput: { name } }) => {
    const simplifiedParts = getSimplifiedString(name).split(" ").map((part) => `%${part}%`);
    const nameQuery = and(...simplifiedParts.map((part) => sql`unaccent(${table.name}) ilike ${part}`));
    const locNameQuery = and(...simplifiedParts.map((part) => ilike(table.localizedName, `%${part}%`)));

    return await db.select(personsPublicCols).from(table)
      .where(or(nameQuery, locNameQuery))
      .limit(C.maxPersonMatches);
  });

export const getOrCreatePersonByWcaIdSF = actionClient.metadata({ permissions: { persons: ["create"] } })
  .inputSchema(z.strictObject({
    wcaId: WcaIdValidator,
  })).action<WcaPersonDto>(async ({ parsedInput: { wcaId } }) => {
    const [person] = await db.select(personsPublicCols).from(table).where(eq(table.wcaId, wcaId)).limit(1);
    if (person) return { person, isNew: false };

    const wcaPerson = await fetchWcaPerson(wcaId);
    if (!wcaPerson) throw new CcActionError(`Person with WCA ID ${wcaId} not found`);

    const res = await createPersonSF({ newPerson: wcaPerson });
    if (!res.data) throw new Error(res.serverError?.message || C.unknownErrorMsg);

    return { person: res.data, isNew: true };
  });

// TO-DO: ADD SUPPORT FOR EXTERNAL DATA ENTRY and ADD LOGGING
export const createPersonSF = actionClient.metadata({ permissions: { persons: ["create"] } })
  .inputSchema(z.strictObject({
    newPerson: PersonValidator,
    ignoreDuplicate: z.boolean().default(false),
  })).action<PersonResponse>(async ({ parsedInput: { newPerson, ignoreDuplicate }, ctx: { session } }) => {
    const isAdmin = await checkUserPermissions(session.user.id, { persons: ["approve"] });

    await validatePerson(newPerson, {
      ignoreDuplicate,
      // isAdmin: user !== "EXT_DEVICE" && user.roles.includes(Role.Admin),
      isAdmin,
    });

    const query = db.insert(table).values({ ...newPerson, approved: false, createdBy: session.user.id });
    const [createdPerson] = await (isAdmin ? query.returning() : query.returning(personsPublicCols));
    return createdPerson;
  });

export const updatePersonSF = actionClient.metadata({ permissions: { persons: ["update"] } })
  .inputSchema(z.strictObject({
    id: z.int(),
    newPerson: PersonValidator,
    ignoreDuplicate: z.boolean().default(false),
  })).action<PersonResponse>(async ({ parsedInput: { id, newPerson, ignoreDuplicate }, ctx: { session } }) => {
    const isAdmin = await checkUserPermissions(session.user.id, { persons: ["approve"] });

    const [person] = await db.select().from(table).where(eq(table.id, id)).limit(1);
    if (!person) throw new CcActionError("Person with the provided ID not found");
    if (!isAdmin && person.approved) throw new CcActionError("You may not edit a person who has been approved");

    await validatePerson(newPerson, { excludeId: id, ignoreDuplicate, isAdmin });

    let personDto: PersonDto = newPerson;

    if (newPerson.wcaId) {
      const wcaPerson = await fetchWcaPerson(newPerson.wcaId);
      if (!wcaPerson) throw new CcActionError(`Person with WCA ID ${newPerson.wcaId} not found`);
      personDto = wcaPerson;
    }

    const query = db.update(table).set(personDto).where(eq(table.id, id));
    const [updatedPerson] = await (isAdmin ? query.returning() : query.returning(personsPublicCols));
    return updatedPerson;
  });

export const deletePersonSF = actionClient.metadata({ permissions: { persons: ["delete"] } })
  .inputSchema(z.strictObject({
    id: z.int(),
  })).action(async ({ parsedInput: { id }, ctx: { session } }) => {
    const isAdmin = await checkUserPermissions(session.user.id, { persons: ["approve"] });

    const [person] = await db.select().from(table).where(eq(table.id, id)).limit(1);
    if (!person) throw new CcActionError("Person with the provided ID not found");
    if (!isAdmin && person.approved) throw new CcActionError("You may not delete an approved person");

    const [user] = await db.select({ username: usersTable.username }).from(usersTable)
      .where(eq(usersTable.personId, person.personId))
      .limit(1);
    if (user) {
      throw new CcActionError(
        `You may not delete a person tied to a user. This person is tied to the user ${user.username}.`,
      );
    }

    // const [result] = await db.select({}).from(resultsTable)
    // const result = await this.resultModel.findOne({
    //   personIds: person.personId,
    // }, { eventId: 1, competitionId: 1 })
    //   .exec();
    // if (result) {
    //   throw new BadRequestException(
    //     `You may not delete a person who has a result. This person has a result in ${result.eventId} at ${result.competitionId}.`,
    //   );
    // }

    // const organizedContest = await this.contestModel.findOne({
    //   organizers: person._id,
    // }, { competitionId: 1 }).exec();
    // if (organizedContest) {
    //   throw new BadRequestException(
    //     `You may not delete a person who has organized a contest. This person was an organizer at ${organizedContest.competitionId}.`,
    //   );
    // }

    await db.delete(table).where(eq(table.id, id));
  });

export const approvePersonSF = actionClient.metadata({ permissions: { persons: ["approve"] } })
  .inputSchema(z.strictObject({
    id: z.int(),
    approveByPersonId: z.boolean().default(false),
    ignoredWcaMatches: z.array(z.string()).default([]),
  })).action<PersonResponse>(async ({ parsedInput: { id, approveByPersonId, ignoredWcaMatches } }) => {
    const [person] = await db.select().from(table).where(eq(approveByPersonId ? table.personId : table.id, id))
      .limit(1);
    if (!person) throw new CcActionError("Person not found");

    // if (!skipValidation) {
    if (person.approved) {
      throw new CcActionError(`${person.name} has already been approved`);
    }

    // const result = await this.resultModel.findOne({ personIds: person.personId, }, { _id: 1 }).exec();
    // if (!result) {
    //   const organizedContest = await this.contestModel.findOne({
    //     organizers: person._id,
    //   }).exec();
    //   if (!organizedContest) {
    //     throw new CcActionError(
    //       `${person.name} has no results and hasn't organized any contests. They could have been added by accident.`,
    //     );
    //   }
    // }
    // }

    return await setPersonToApproved(person, { requireWcaId: false, ignoredWcaMatches });
  });

async function setPersonToApproved(
  person: PersonResponse,
  { requireWcaId, ignoredWcaMatches }: { requireWcaId: boolean; ignoredWcaMatches: string[] },
) {
  const updatePersonObject: Partial<PersonResponse> = {};

  if (!person.wcaId) {
    const res = await fetch(
      `https://www.worldcubeassociation.org/api/v0/search/users?persons_table=true&q=${person.name}`,
    );
    if (res.ok) {
      const { result: wcaPersons } = await res.json();

      if (!requireWcaId) {
        for (const wcaPerson of wcaPersons) {
          const [name] = getNameAndLocalizedName(wcaPerson.name);

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
        const [name, localizedName] = getNameAndLocalizedName(wcaPerson.name);

        if (name === person.name && wcaPerson.country_iso2 === person.countryIso2) {
          updatePersonObject.wcaId = wcaPerson.wca_id;
          if (localizedName) updatePersonObject.localizedName = localizedName;
        }
      }
    }
  }

  if (!requireWcaId || person.wcaId) {
    // this.logger.logAndSave(
    //   `Approving person ${person.name} (CC ID: ${person.personId})`,
    //   LogType.ApprovePersons,
    // );

    updatePersonObject.approved = true;
  }

  if (Object.keys(updatePersonObject).length > 0) {
    const [updatedPerson] = await db.update(table).set(updatePersonObject).where(eq(table.id, person.id)).returning();
    return updatedPerson;
  }

  return person;
}

async function validatePerson(
  newPerson: PersonDto,
  {
    ignoreDuplicate,
    excludeId,
    isAdmin,
  }: {
    ignoreDuplicate?: boolean;
    excludeId?: number;
    isAdmin?: boolean;
  } = {},
) {
  const excludeCondition = excludeId ? ne(table.id, excludeId) : undefined;

  if (newPerson.wcaId) {
    const [sameWcaIdPerson] = await db.select().from(table).where(and(
      eq(table.wcaId, newPerson.wcaId),
      excludeCondition,
    )).limit(1);

    if (sameWcaIdPerson) throw new CcActionError("A person with the same WCA ID already exists in the CC database");
  } else if (!ignoreDuplicate || !isAdmin) {
    const [duplicatePerson] = await db.select().from(table).where(and(
      eq(table.name, newPerson.name),
      eq(table.countryIso2, newPerson.countryIso2),
      excludeCondition,
    )).limit(1);

    if (duplicatePerson) {
      throw new CcActionError(
        `A person with the same name and country already exists. If it's actually a different competitor with the same name, ${
          isAdmin
            ? "simply submit them again."
            : "please contact the admin team. For now, simply add (2) at the end of their name to do data entry."
        }`,
        { data: { isDuplicatePerson: true } },
      );
    }
  }
}
