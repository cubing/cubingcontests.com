vi.mock("server-only", () => ({}));
vi.mock("~/server/logger.ts", () => ({ logger: pino() }));
vi.mock("~/server/db/provider.ts", () => ({ db: dbMock }));
vi.mock("~/server/auth.ts", () => ({ auth: authMock }));

import { eq, sql } from "drizzle-orm";
import pino from "pino";
import { afterEach, beforeAll, vi } from "vitest";
import { authMock } from "~/__mocks__/auth-mock.ts";
import { apply as applyDbSchema, dbMock } from "~/__mocks__/db-mock.ts";
import {
  contestsTable,
  eventsTable,
  membersTable,
  personsTable,
  recordConfigsTable,
  regionsTable,
  resultsTable,
  roundsTable,
  rrSchema,
} from "~/__mocks__/db-schema.ts";
import { contestsStub } from "~/__mocks__/stubs/contestsStub.ts";
import { eventsStub } from "~/__mocks__/stubs/eventsStub.ts";
import { personsStub } from "~/__mocks__/stubs/personsStub.ts";
import { recordConfigsStub } from "~/__mocks__/stubs/recordConfigsStub.ts";
import { resultsStub } from "~/__mocks__/stubs/resultsStub.ts";
import { roundsStub } from "~/__mocks__/stubs/roundsStub.ts";
import { getDefaultRegions } from "~/helpers/default-regions.ts";
import { testUsers } from "~/helpers/test-data/test-users.ts";
import type { OrganizationMetadata } from "~/helpers/types.ts";

beforeAll(async () => {
  await applyDbSchema();

  const ctx = await authMock.$context;
  const authTest = ctx.test;

  const org = authTest.createOrganization!({
    id: "default",
    name: "Test Organization",
    slug: "default",
    metadata: JSON.stringify({
      private: false,
      contactEmail: "admin@example.com",
      showDonationLinks: false,
    } satisfies OrganizationMetadata),
  });
  await authTest.saveOrganization!(org);

  for (const testUser of testUsers) {
    const { member: newMember, ...newUser } = testUser;
    const user = authTest.createUser(newUser);
    await authTest.saveUser(user);

    if (newMember) {
      const createdMember = await authTest.addMember!({
        userId: user.id,
        organizationId: org.id,
        role: newMember.role,
      } as any);
      await dbMock
        .update(membersTable)
        .set({ personId: newMember.personId })
        .where(eq(membersTable.id, createdMember.id as string));
    }
  }

  await Promise.all([
    dbMock.insert(recordConfigsTable).values(recordConfigsStub),
    dbMock.insert(eventsTable).values(eventsStub),
    dbMock.insert(regionsTable).values(getDefaultRegions("default")),
  ]);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

export async function reseedTestData() {
  // This has to be done separately, because the results table has a foreign key reference to the rounds table
  await Promise.all([
    dbMock.delete(resultsTable),
    dbMock.execute(sql.raw(`ALTER SEQUENCE ${rrSchema.schemaName}.results_id_seq RESTART WITH 1`)),
  ]);

  await Promise.all([
    dbMock.delete(roundsTable),
    dbMock.execute(sql.raw(`ALTER SEQUENCE ${rrSchema.schemaName}.rounds_id_seq RESTART WITH 1`)),
    dbMock.delete(contestsTable),
    dbMock.execute(sql.raw(`ALTER SEQUENCE ${rrSchema.schemaName}.contests_id_seq RESTART WITH 1`)),
    dbMock.delete(personsTable),
    dbMock.execute(sql.raw(`ALTER SEQUENCE ${rrSchema.schemaName}.persons_id_seq RESTART WITH 1`)),
  ]);

  await Promise.all([
    dbMock.insert(personsTable).values(personsStub.map(({ id, ...p }) => p)),
    dbMock.insert(contestsTable).values(contestsStub),
    dbMock.insert(roundsTable).values(roundsStub.map(({ id, ...r }) => r)),
    dbMock.insert(resultsTable).values(resultsStub),
  ]);
}
