import { eq } from "drizzle-orm";
import { db } from "~/server/db/provider.ts";
import { personsPublicCols, personsTable } from "~/server/db/schema/persons.ts";
import { authorizeUser } from "~/server/serverUtilityFunctions.ts";
import UserSettingsScreen from "./UserSettingsScreen.tsx";

async function UserSettingsPage() {
  const { user } = await authorizeUser();
  const person = user.personId
    ? (await db.select(personsPublicCols).from(personsTable).where(eq(personsTable.id, user.personId)).limit(1)).at(0)
    : undefined;

  return (
    <section>
      <h2 className="mb-4 text-center">Settings</h2>
      <UserSettingsScreen person={person} />
    </section>
  );
}

export default UserSettingsPage;
