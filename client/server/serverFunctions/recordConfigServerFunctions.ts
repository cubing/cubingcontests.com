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

export const createRecordConfigSF = actionClient.metadata({}).inputSchema(z.strictObject({
  newRecordConfig: RecordConfigValidator,
})).action<RecordConfigResponse>(async ({ parsedInput: { newRecordConfig } }) => {
  const [createdRecordConfig] = await db.insert(table).values(newRecordConfig).returning(recordConfigsPublicCols);
  return createdRecordConfig;
});
