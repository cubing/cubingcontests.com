import { authorizeUser } from "~/server/serverUtilityFunctions.ts";
import { db } from "~/server/db/provider.ts";
import { personsPublicCols, personsTable } from "~/server/db/schema/persons.ts";
import { eq } from "drizzle-orm";
import UserSettingsScreen from "./UserSettingsScreen.tsx";

async function UserSettingsPage() {
  const { user } = await authorizeUser();
  const person = user.personId
    ? (await db.select(personsPublicCols).from(personsTable).where(eq(personsTable.personId, user.personId)).limit(1))
      .at(0)
    : undefined;

  return <UserSettingsScreen person={person} />;
}

export default UserSettingsPage;
