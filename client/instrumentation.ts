import type fsType from "node:fs";
import { eq } from "drizzle-orm";
import type { auth as authType } from "~/server/auth.ts";
import type { db as dbType } from "~/server/db/provider.ts";
import { accountsTable, usersTable } from "~/server/db/schema/auth-schema.ts";
import { personsTable } from "./server/db/schema/persons.ts";
import { eventsTable } from "./server/db/schema/events.ts";

const message =
  "The EMAIL_TOKEN environment variable must be empty while seeding the DB to avoid sending lots of verification emails for the users being seeded. Remove it and comment out the sendVerificationEmail function in auth.ts, and then add them back after the DB has been seeded.";

export async function register() {
  // Seed test users for development
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV !== "production") {
    const { db }: { db: typeof dbType } = await import("~/server/db/provider.ts");
    const { auth }: { auth: typeof authType } = await import("~/server/auth.ts");
    const fs: typeof fsType = await import("node:fs");

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
        if (process.env.EMAIL_TOKEN) throw new Error(message);

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

    // Seed database with old Mongo DB data.
    // This assumes the local dev environment won't have 100 users.
    if ((await db.select({ id: usersTable.id }).from(usersTable).limit(100)).length < 100) {
      if (process.env.EMAIL_TOKEN) throw new Error(message);

      console.log("Seeding users...");

      try {
        const usersDump = JSON.parse((await fs.readFileSync("./dump/users.json")) as any);

        for (const user of usersDump.filter((u: any) => !u.confirmationCodeHash)) {
          const res = await auth.api.signUpEmail({
            body: {
              email: user.email,
              username: user.username,
              displayUsername: user.username,
              password: user.password,
              personId: user.personId,
              name: "",
            },
          });

          await db.update(usersTable).set({
            emailVerified: true,
            role: user.roles.includes("admin") ? "admin" : user.roles.includes("mod") ? "mod" : "user",
            createdAt: new Date(user.createdAt.$date),
            updatedAt: new Date(user.updatedAt.$date),
          }).where(eq(usersTable.id, res.user.id));

          await db.update(accountsTable).set({
            password: user.password,
            createdAt: new Date(user.createdAt.$date),
            updatedAt: new Date(user.updatedAt.$date),
          }).where(eq(accountsTable.userId, res.user.id));
        }
      } catch (e) {
        console.error("Unable to load users dump:", e);
      }
    }

    if ((await db.select({ id: personsTable.id }).from(personsTable).limit(1)).length === 0) {
      console.log("Seeding persons...");

      try {
        const personsDump = JSON.parse((await fs.readFileSync("./dump/persons.json")) as any);

        await db.insert(personsTable).values(personsDump.map((p: any) => ({
          personId: p.personId,
          wcaId: p.wcaId,
          name: p.name,
          localizedName: p.localizedName,
          countryIso2: p.countryIso2,
          approved: !p.unapproved,
          createdAt: new Date(p.createdAt.$date),
          updatedAt: new Date(p.updatedAt.$date),
        })));
      } catch (e) {
        console.error("Unable to load persons dump:", e);
      }
    }

    if ((await db.select({ id: eventsTable.id }).from(eventsTable).limit(1)).length === 0) {
      console.log("Seeding events...");

      try {
        const eventsDump = JSON.parse((await fs.readFileSync("./dump/events.json")) as any);
        const eventRulesDump = JSON.parse((await fs.readFileSync("./dump/eventrules.json")) as any);

        await db.insert(eventsTable).values(eventsDump.map((e: any) => {
          const eventRule = eventRulesDump.find((er: any) => er.eventId === e.eventId);

          return ({
            eventId: e.eventId,
            name: e.name,
            category: e.groups.includes(1)
              ? "wca"
              : e.groups.includes(2)
              ? "unofficial"
              : e.groups.includes(3)
              ? "extreme-bld"
              : e.groups.includes(4)
              ? "removed"
              : "miscellaneous",
            rank: e.rank,
            format: e.format,
            defaultRoundFormat: e.defaultRoundFormat,
            participants: e.participants,
            submissionsAllowed: e.groups.includes(6),
            removedWca: e.groups.includes(8),
            hasMemo: e.groups.includes(10),
            hidden: e.groups.includes(9),
            description: e.description || null,
            rule: eventRule?.rule || null,
            createdAt: new Date(e.createdAt.$date),
            updatedAt: new Date(e.updatedAt.$date),
          });
        }));
      } catch (e) {
        console.error("Unable to load events dump or event rules dump:", e);
      }
    }

    console.log("DB seeded successfully");
  }
}
