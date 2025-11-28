"use server";

import { and, eq, ilike, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { CountryCodes } from "~/helpers/Countries.ts";
import { C } from "~/helpers/constants.ts";
import { fetchWcaPerson, getSimplifiedString } from "~/helpers/sharedFunctions.ts";
import { getIsAdmin } from "~/helpers/utilityFunctions.ts";
import { type PersonDto, PersonValidator } from "~/helpers/validators/Person.ts";
import { WcaIdValidator } from "~/helpers/validators/Validators.ts";
import { db } from "~/server/db/provider.ts";
import {
  type PersonResponse,
  personsPublicCols,
  type SelectPerson,
  personsTable as table,
} from "~/server/db/schema/persons.ts";
import { actionClient, CcActionError } from "../safeAction.ts";
import { checkUserPermissions, setPersonToApproved } from "../serverUtilityFunctions.ts";

type GetOrCreatePersonObject = {
  person: PersonResponse;
  isNew: boolean;
};

export const getPersonByPersonIdSF = actionClient
  .metadata({ permissions: null })
  .inputSchema(
    z.strictObject({
      personId: z.int().min(1),
    }),
  )
  .action<PersonResponse>(async ({ parsedInput: { personId } }) => {
    const [person] = await db.select(personsPublicCols).from(table).where(eq(table.personId, personId));
    if (!person) throw new CcActionError(`Person with ID ${personId} not found`);
    return person;
  });

export const getPersonsByNameSF = actionClient
  .metadata({ permissions: null })
  .inputSchema(
    z.strictObject({
      name: z.string().max(60),
    }),
  )
  .action<PersonResponse[]>(async ({ parsedInput: { name } }) => {
    const simplifiedParts = getSimplifiedString(name)
      .split(" ")
      .map((part) => `%${part}%`);
    const nameQuery = and(...simplifiedParts.map((part) => sql`unaccent(${table.name}) ilike ${part}`));
    const locNameQuery = and(...simplifiedParts.map((part) => ilike(table.localizedName, `%${part}%`)));

    return await db.select(personsPublicCols).from(table).where(or(nameQuery, locNameQuery)).limit(C.maxPersonMatches);
  });

export const getOrCreatePersonSF = actionClient
  .metadata({ permissions: { persons: ["create"] } })
  .inputSchema(
    z.strictObject({
      name: z.string(),
      countryIso2: z.enum(CountryCodes),
    }),
  )
  .action<GetOrCreatePersonObject>(async ({ parsedInput: { name, countryIso2 } }) => {
    const persons = await db
      .select(personsPublicCols)
      .from(table)
      .where(and(eq(table.name, name), eq(table.countryIso2, countryIso2)));

    if (persons.length > 1)
      throw new CcActionError(`Multiple people were found with the name ${name} and country ${countryIso2}`);

    if (persons.length === 1) return { person: persons[0], isNew: false };

    const res = await createPersonSF({ newPersonDto: { name, countryIso2 } });
    if (!res.data) throw new Error(res.serverError?.message || C.unknownErrorMsg);

    return { person: res.data, isNew: true };
  });

export const getOrCreatePersonByWcaIdSF = actionClient
  .metadata({ permissions: { persons: ["create"] } })
  .inputSchema(
    z.strictObject({
      wcaId: WcaIdValidator,
    }),
  )
  .action<GetOrCreatePersonObject>(async ({ parsedInput: { wcaId } }) => {
    const [person] = await db.select(personsPublicCols).from(table).where(eq(table.wcaId, wcaId)).limit(1);
    if (person) return { person, isNew: false };

    const wcaPerson = await fetchWcaPerson(wcaId);
    if (!wcaPerson) throw new CcActionError(`Person with WCA ID ${wcaId} not found`);

    const res = await createPersonSF({ newPersonDto: wcaPerson });
    if (!res.data) throw new Error(res.serverError?.message || C.unknownErrorMsg);

    return { person: res.data, isNew: true };
  });

// TO-DO: ADD SUPPORT FOR EXTERNAL DATA ENTRY and ADD LOGGING
export const createPersonSF = actionClient
  .metadata({ permissions: { persons: ["create"] } })
  .inputSchema(
    z.strictObject({
      newPersonDto: PersonValidator,
      ignoreDuplicate: z.boolean().default(false),
    }),
  )
  .action<PersonResponse | SelectPerson>(
    async ({ parsedInput: { newPersonDto, ignoreDuplicate }, ctx: { session } }) => {
      const canApprove = await checkUserPermissions(session.user.id, { persons: ["approve"] });

      await validatePerson(newPersonDto, { ignoreDuplicate, isAdmin: getIsAdmin(session.user.role) });

      const query = db.insert(table).values({ ...newPersonDto, createdBy: session.user.id });
      const [createdPerson] = await (canApprove ? query.returning() : query.returning(personsPublicCols));
      return createdPerson;
    },
  );

export const updatePersonSF = actionClient
  .metadata({ permissions: { persons: ["update"] } })
  .inputSchema(
    z.strictObject({
      id: z.int(),
      newPersonDto: PersonValidator,
      ignoreDuplicate: z.boolean().default(false),
    }),
  )
  .action<PersonResponse | SelectPerson>(
    async ({ parsedInput: { id, newPersonDto, ignoreDuplicate }, ctx: { session } }) => {
      const canApprove = await checkUserPermissions(session.user.id, { persons: ["approve"] });

      const [person] = await db.select().from(table).where(eq(table.id, id)).limit(1);
      if (!person) throw new CcActionError("Person with the provided ID not found");
      if (!canApprove && person.approved) throw new CcActionError("You may not edit a person who has been approved");
      if (person.countryIso2 !== newPersonDto.countryIso2)
        throw new CcActionError(
          "Changing a person's country is not currently supported. Please contact a developer regarding this.",
        );

      await validatePerson(newPersonDto, { excludeId: id, ignoreDuplicate, isAdmin: canApprove });

      let personDto: PersonDto = newPersonDto;

      if (newPersonDto.wcaId) {
        const wcaPerson = await fetchWcaPerson(newPersonDto.wcaId);
        if (!wcaPerson) throw new CcActionError(`Person with WCA ID ${newPersonDto.wcaId} not found`);
        personDto = wcaPerson;
      }

      const query = db.update(table).set(personDto).where(eq(table.id, id));
      const [updatedPerson] = await (canApprove ? query.returning() : query.returning(personsPublicCols));
      return updatedPerson;
    },
  );

export const deletePersonSF = actionClient
  .metadata({ permissions: { persons: ["delete"] } })
  .inputSchema(
    z.strictObject({
      id: z.int(),
    }),
  )
  .action(async ({ parsedInput: { id }, ctx: { session } }) => {
    const canApprove = await checkUserPermissions(session.user.id, { persons: ["approve"] });

    const [person] = await db.select().from(table).where(eq(table.id, id)).limit(1);
    if (!person) throw new CcActionError("Person with the provided ID not found");
    if (!canApprove && person.approved) throw new CcActionError("You may not delete an approved person");

    const user = await db.query.users.findFirst({ where: { personId: person.personId } });
    if (user) {
      throw new CcActionError(
        `You may not delete a person tied to a user. This person is tied to the user ${user.username}.`,
      );
    }

    const result = await db.query.results.findFirst({ where: { personIds: { arrayContains: [person.personId] } } });
    if (result) {
      throw new CcActionError(
        `You may not delete a person who has a result. This person has a result in ${result.eventId}${result.competitionId ? ` at ${result.competitionId}` : ""}.`,
      );
    }

    const organizedContest = await db.query.contests.findFirst({ where: { organizers: { arrayContains: [id] } } });
    if (organizedContest) {
      throw new CcActionError(
        `You may not delete a person who has organized a contest. This person was an organizer at ${organizedContest.competitionId}.`,
      );
    }

    await db.delete(table).where(eq(table.id, id));
  });

export const approvePersonSF = actionClient
  .metadata({ permissions: { persons: ["approve"] } })
  .inputSchema(
    z.strictObject({
      id: z.int(),
      approveByPersonId: z.boolean().default(false),
      ignoredWcaMatches: z.array(z.string()).default([]),
    }),
  )
  .action<SelectPerson>(async ({ parsedInput: { id, approveByPersonId, ignoredWcaMatches } }) => {
    const [person] = await db
      .select()
      .from(table)
      .where(eq(approveByPersonId ? table.personId : table.id, id))
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

async function validatePerson(
  newPersonDto: PersonDto,
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

  if (newPersonDto.wcaId) {
    const [sameWcaIdPerson] = await db
      .select()
      .from(table)
      .where(and(eq(table.wcaId, newPersonDto.wcaId), excludeCondition))
      .limit(1);

    if (sameWcaIdPerson) throw new CcActionError("A person with the same WCA ID already exists in the CC database");
  } else if (!ignoreDuplicate || !isAdmin) {
    const [duplicatePerson] = await db
      .select()
      .from(table)
      .where(and(eq(table.name, newPersonDto.name), eq(table.countryIso2, newPersonDto.countryIso2), excludeCondition))
      .limit(1);

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
