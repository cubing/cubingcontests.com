import "server-only";
import { getColumns } from "drizzle-orm";
import * as d from "drizzle-orm/pg-core";
import { RegionTypeValues } from "~/helpers/types.ts";
import { tableTimestamps } from "~/server/db/db-utils.ts";
import { organizationsTable } from "~/server/db/schema/auth-schema.ts";
import { rrSchema } from "~/server/db/schema/schema.ts";

export const regionTypeEnum = rrSchema.enum("region_type", RegionTypeValues);

export const regionsTable = rrSchema.table(
  "regions",
  {
    id: d.integer().primaryKey().generatedAlwaysAsIdentity(),
    organizationId: d
      .text()
      .references(() => organizationsTable.id, { onDelete: "cascade" })
      .notNull(),
    name: d.text().notNull(),
    shortName: d.text(),
    code: d.text().notNull(),
    type: regionTypeEnum().notNull(),
    superRegionCode: d.text(), // if null that means it's a super-region or a meta-region
    superRegionRecordType: d.text(), // if null that means it's a meta-region
    ...tableTimestamps,
  },
  (table) => [
    d.unique("unique_regions_code").on(table.organizationId, table.code),
    d
      .foreignKey({
        columns: [table.organizationId, table.superRegionCode],
        foreignColumns: [table.organizationId, table.code],
        name: "regions_super_region_code_fk",
      })
      .onUpdate("cascade"),
  ],
);

export type InsertRegion = typeof regionsTable.$inferInsert;
export type SelectRegion = typeof regionsTable.$inferSelect;

const { organizationId: _, createdAt: _1, updatedAt: _2, ...regionsPublicCols } = getColumns(regionsTable);

export { regionsPublicCols };

export type RegionResponse = Pick<SelectRegion, keyof typeof regionsPublicCols>;
