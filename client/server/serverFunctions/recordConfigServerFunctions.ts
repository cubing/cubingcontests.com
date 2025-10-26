"use server";

import z from "zod";
import { actionClient } from "../safeAction.ts";
import { RecordConfigValidator } from "~/helpers/validators/RecordConfig.ts";
import {
  RecordConfigResponse,
  recordConfigsPublicCols,
  recordConfigsTable as table,
} from "../db/schema/record-configs.ts";
import { db } from "../db/provider.ts";
import { eq } from "drizzle-orm";

export const createRecordConfigSF = actionClient.metadata({ permissions: { recordConfigs: ["create-and-update"] } })
  .inputSchema(z.strictObject({
    newRecordConfigDto: RecordConfigValidator,
  })).action<RecordConfigResponse>(async ({ parsedInput: { newRecordConfigDto } }) => {
    const [createdRecordConfig] = await db.insert(table).values(newRecordConfigDto).returning(recordConfigsPublicCols);
    return createdRecordConfig;
  });

export const updateRecordConfigSF = actionClient.metadata({ permissions: { recordConfigs: ["create-and-update"] } })
  .inputSchema(z.strictObject({
    id: z.int(),
    newRecordConfigDto: RecordConfigValidator,
  })).action<RecordConfigResponse>(async ({ parsedInput: { id, newRecordConfigDto } }) => {
    const [updatedRecordConfig] = await db.update(table)
      .set(newRecordConfigDto)
      .where(eq(table.id, id))
      .returning(recordConfigsPublicCols);
    return updatedRecordConfig;
  });
