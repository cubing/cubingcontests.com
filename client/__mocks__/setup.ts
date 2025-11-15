import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { vi } from "vitest";
import { relations } from "~/server/db/relations.ts";
import { eventsTable } from "~/server/db/schema/events.ts";
import { personsTable } from "~/server/db/schema/persons.ts";
import { recordConfigsTable } from "~/server/db/schema/record-configs.ts";
import { resultsTable } from "~/server/db/schema/results.ts";
import * as schema from "~/server/db/schema/schema.ts";
import { eventsStub } from "./stubs/events.stub.ts";
import { personsStub } from "./stubs/persons.stub.ts";
import { recordConfigsStub } from "./stubs/record-configs.stub.ts";
import { resultsStub } from "./stubs/results.stub.ts";

vi.mock("server-only", () => ({}));

// Source: https://github.com/drizzle-team/drizzle-orm/discussions/4216
vi.mock("~/server/db/provider.ts", async () => {
  // Use require to defeat dynamic require error
  // (https://github.com/drizzle-team/drizzle-orm/issues/2853#issuecomment-2668459509)
  const { createRequire } = await vi.importActual<typeof import("node:module")>("node:module");
  const require = createRequire(import.meta.url);
  const { pushSchema } = require("drizzle-kit/api") as typeof import("drizzle-kit/api");

  const client = new PGlite();
  // This uses some of the same options from drizzle.config.ts
  // pushSchema doesn't respect the casing parameter yet. See https://github.com/drizzle-team/drizzle-orm/pull/5018
  // const db = drizzle({ client, schema, relations, casing: "snake_case" });
  const db = drizzle({ client, schema, relations });

  // Apply schema to db
  const { apply } = await pushSchema(schema, db as any);
  await apply();

  // Seed test data
  await db.insert(personsTable).values(personsStub());
  await db.insert(eventsTable).values(eventsStub());
  await db.insert(resultsTable).values(resultsStub());
  await db.insert(recordConfigsTable).values(recordConfigsStub());

  return { db };
});
