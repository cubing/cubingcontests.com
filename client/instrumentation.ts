import { eq } from "drizzle-orm";
import { type auth as authType } from "~/server/auth.ts";
import { type db as dbType } from "~/server/db/provider.ts";
import { accountsTable, usersTable } from "~/server/db/schema/auth-schema.ts";

export async function register() {
  // Seed test users for development
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV !== "production") {
    const { db }: { db: typeof dbType } = await import("~/server/db/provider.ts");
    const { auth }: { auth: typeof authType } = await import("~/server/auth.ts");

    const testUsers = [
      {
        email: "admin@cc.com",
        username: "admin",
        name: "",
        password: "Temporary_good_password123",
        role: "admin",
      },
      {
        email: "mod@cc.com",
        username: "mod",
        name: "",
        password: "Temporary_good_password123",
        role: "mod",
      },
      {
        email: "user@cc.com",
        username: "user",
        name: "",
        password: "Temporary_good_password123",
      },
    ];

    for (const testUser of testUsers) {
      const userExists =
        (await db.select().from(usersTable).where(eq(usersTable.email, testUser.email)).limit(1)).length > 0;

      if (!userExists) {
        const { role, ...body } = testUser;
        await auth.api.signUpEmail({ body });

        // Verify email
        const [user] = await db.update(usersTable)
          .set({ emailVerified: true })
          .where(eq(usersTable.email, testUser.email))
          .returning();

        // Set the password to "cc"
        await db.update(accountsTable)
          .set({ password: "$2b$10$ZQ3h2HwwOgLTRveMw/NbFes0b.u6OOxYrnG10dwDkHiQBOMwx7M52" })
          .where(eq(accountsTable.userId, user.id));

        // Set role
        if (role) {
          await db.update(usersTable).set({ role }).where(eq(usersTable.id, user.id));
        }

        console.log(`Seeded test user: ${testUser.username}`);
      }
    }
  }
}
