import { beforeEach, vi } from "vitest";
import { apply, db } from "~/__mocks__/dbProvider.ts";
import { eventsStub } from "~/__mocks__/stubs/events.stub.ts";
import { personsStub } from "~/__mocks__/stubs/persons.stub.ts";
import { recordConfigsStub } from "~/__mocks__/stubs/record-configs.stub.ts";
import { resultsStub } from "~/__mocks__/stubs/results.stub.ts";
import { eventsTable } from "~/server/db/schema/events.ts";
import { personsTable } from "~/server/db/schema/persons.ts";
import { recordConfigsTable } from "~/server/db/schema/record-configs.ts";
import { resultsTable } from "~/server/db/schema/results.ts";

vi.mock("server-only", () => ({}));

vi.mock("~/server/db/provider.ts", async () => {
  await apply();
  return { db };
});

// Re-seed test data
beforeEach(async () => {
  await db.delete(personsTable);
  await db.delete(eventsTable);
  await db.delete(resultsTable);
  await db.delete(recordConfigsTable);

  await db.insert(personsTable).values(personsStub);
  await db.insert(eventsTable).values(eventsStub);
  await db.insert(resultsTable).values(resultsStub);
  await db.insert(recordConfigsTable).values(recordConfigsStub);
});
