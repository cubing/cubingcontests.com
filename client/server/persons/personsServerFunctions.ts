"use server";

import { and, eq } from "drizzle-orm";
import { fetchWcaPerson } from "~/helpers/sharedFunctions.ts";
import { CcActionError, WcaPersonDto } from "~/helpers/types.ts";
import { db } from "~/server/db/provider.ts";
import { InsertPerson, PersonResponse, personsPublicCols, personsTable as table } from "~/server/db/schema/persons.ts";
import { actionClient } from "../safeAction.ts";
import { z } from "zod/v4";
import { checkUserPermissions } from "../serverUtilityFunctions.ts";
import { WcaIdValidator } from "~/helpers/validators/Validators.ts";

export const getOrCreatePersonByWcaIdSF = actionClient.metadata({ permissions: { persons: ["create"] } }).inputSchema(
  z.strictObject({
    wcaId: WcaIdValidator,
  }),
).action<WcaPersonDto>(async ({ parsedInput }) => {
  const wcaId = parsedInput.wcaId.toUpperCase();

  // Try to find existing person with the given WCA ID
  const [person] = await db.select(personsPublicCols).from(table).where(eq(table.wcaId, wcaId)).limit(1);
  if (person) return { person, isNew: false };

  // Create new person by fetching the person data from the WCA API
  const wcaPerson = await fetchWcaPerson(wcaId);
  if (!wcaPerson) throw new CcActionError(`Person with WCA ID ${wcaId} not found`);

  return {
    person: await createPersonSF({ newPerson: wcaPerson }),
    isNew: true,
  };
});

// TO-DO: ADD SUPPORT FOR EXTERNAL DATA ENTRY and ADD LOGGING
export const createPersonSF = actionClient.metadata({ permissions: ["create"] }).inputSchema(z.strictObject({
  newPerson: z.strictObject<InsertPerson>({
    name: z.string(),
    localizedName: z.string().optional(),
    countryIso2: z.string().length(2),
    wcaId: WcaIdValidator.optional(),
  }),
  ignoreDuplicate: z.boolean().default(false),
})).action<PersonResponse>(async ({ parsedInput: { newPerson }, ctx: { session } }) => {
  const isAdmin = await checkUserPermissions(session.user.id, { persons: ["approve"] });

  await validatePerson(newPerson, {
    // ignoreDuplicate,
    // isAdmin: user !== "EXT_DEVICE" && user.roles.includes(Role.Admin),
    isAdmin,
  });

  const [createdPerson] = await db.insert(table).values([{ ...newPerson, createdBy: session.user.id }]).returning(
    personsPublicCols,
  );
  return createdPerson;
});

async function validatePerson(
  newPerson: InsertPerson,
  { ignoreDuplicate, excludeId, isAdmin }: {
    ignoreDuplicate?: boolean;
    excludeId?: string;
    isAdmin?: boolean;
  } = {},
) {
  // const queryBase: any = excludeId ? { _id: { $ne: excludeId } } : {};

  if (newPerson.wcaId) {
    // const sameWcaIdPerson = await this.personModel.findOne({ ...queryBase, wcaId: newPerson.wcaId }).exec();
    const [sameWcaIdPerson] = await db.select().from(table).where(eq(table.wcaId, newPerson.wcaId)).limit(1);

    if (sameWcaIdPerson) throw new CcActionError("A person with the same WCA ID already exists in the CC database");
  } else if (!ignoreDuplicate) {
    // const sameNamePerson = await this.personModel.findOne({
    //   ...queryBase,
    //   name: newPerson.name,
    //   countryIso2: newPerson.countryIso2,
    // }).exec();
    const [sameNamePerson] = await db.select().from(table).where(
      and(eq(table.name, newPerson.name), eq(table.countryIso2, newPerson.countryIso2)),
    ).limit(1);

    if (sameNamePerson) {
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
