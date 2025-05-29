"use server";

import { desc, eq, inArray } from "drizzle-orm";
import { fetchWcaPerson } from "~/helpers/sharedFunctions.ts";
import { Creator, ModPersonsData, WcaPersonDto } from "~/helpers/types.ts";
import { FetchObj } from "~/helpers/types/FetchObj.ts";
import { db } from "~/server/db/provider.ts";
import { users as usersTable } from "~/server/db/schema/auth-schema.ts";
import { persons as table, personsPublicCols } from "~/server/db/schema/persons.ts";
import { authorizeUser, checkUserPermissions } from "~/server/utilityServerFunctions.ts";

export async function getModPersonsSF(): Promise<FetchObj<ModPersonsData>> {
  const { user } = await authorizeUser({ persons: ["create", "update", "delete"] });
  const isAdmin = await checkUserPermissions(user.id, { persons: ["approve"] });

  const selectPromise = isAdmin ? db.select() : db.select(personsPublicCols);
  const persons = await selectPromise.from(table).orderBy(desc(table.personId));

  let users: Creator[] | undefined;

  if (isAdmin) {
    const personIds = Array.from(new Set(persons.map((p) => p.personId)));
    users = await db.select({ id: usersTable.id, username: usersTable.username, email: usersTable.email })
      .from(usersTable).where(inArray(usersTable.personId, personIds));
  }

  return { success: true, data: { persons, users } };
}

export async function getOrCreatePersonByWcaIdSF(wcaId: string): Promise<FetchObj<WcaPersonDto>> {
  await authorizeUser({ persons: ["create"] });
  wcaId = wcaId.toUpperCase();

  // Try to find existing person with the given WCA ID
  const [person] = await db.select(personsPublicCols).from(table).where(eq(table.wcaId, wcaId)).limit(1);
  if (person) return { success: true, data: { person, isNew: false } };

  // Create new person by fetching the person data from the WCA API
  const wcaPerson = await fetchWcaPerson(wcaId);
  if (!wcaPerson) return { success: false, error: { code: "NOT_FOUND" } };

  return {
    success: true,
    data: {
      person: await createPersonSF(wcaPerson, { user }),
      isNew: true,
    },
  };
}

export async function createPersonSF(
  personDto: PersonDto,
  { user, ignoreDuplicate }: { user: IPartialUser | "EXT_DEVICE"; ignoreDuplicate?: boolean },
): Promise<PersonDocument | IFePerson> {
  this.logger.logAndSave(
    `Creating person with name ${personDto.name} and ${personDto.wcaId ? `WCA ID ${personDto.wcaId}` : "no WCA ID"}`,
    LogType.CreatePerson,
  );

  await this.validateAndCleanUpPerson(personDto, {
    ignoreDuplicate,
    isAdmin: user !== "EXT_DEVICE" && user.roles.includes(Role.Admin),
  });

  const [newestPerson] = await this.personModel.find({}, { personId: 1 })
    .sort({ personId: -1 }).limit(1).exec();
  const createdPerson = await this.personModel.create({
    ...personDto,
    unapproved: true,
    personId: newestPerson ? newestPerson.personId + 1 : 1,
    createdBy: user !== "EXT_DEVICE" ? new mongo.ObjectId(user._id as string) : undefined,
  });

  return this.getFrontendPerson(createdPerson, { user });
}
