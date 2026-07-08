"use server";

import { eq } from "drizzle-orm";
import z from "zod";
import { RecordCategoryValues } from "~/helpers/types.ts";
import { RecordConfigValidator } from "~/helpers/validators/RecordConfig.ts";
import { getRecordConfigsSet, logMessage } from "~/server/server-only-functions.ts";
import { db } from "../db/provider.ts";
import {
  type RecordConfigResponse,
  recordConfigsPublicCols,
  recordConfigsTable as table,
} from "../db/schema/record-configs.ts";
import { actionClient, RrActionError } from "../safeAction.ts";

export const createRecordConfigSF = actionClient
  .metadata({ auth: { useOrganization: true, orgPermissions: { recordConfigs: ["create-and-update"] } } })
  .inputSchema(
    z.strictObject({
      newRecordConfigDto: RecordConfigValidator,
    }),
  )
  .action<RecordConfigResponse>(async ({ parsedInput: { newRecordConfigDto }, ctx: { session } }) => {
    const { category, recordTypeId, label } = newRecordConfigDto;
    logMessage(
      "RR0027",
      `Creating record config with category ${category}, record type ID ${recordTypeId} and label ${label}`,
    );

    const [createdRecordConfig] = await db
      .insert(table)
      .values({ ...newRecordConfigDto, organizationId: session.organization!.id })
      .returning(recordConfigsPublicCols);
    return createdRecordConfig;
  });

export const updateRecordConfigSF = actionClient
  .metadata({ auth: { useOrganization: true, orgPermissions: { recordConfigs: ["create-and-update"] } } })
  .inputSchema(
    z.strictObject({
      id: z.int(),
      newRecordConfigDto: RecordConfigValidator,
    }),
  )
  .action<RecordConfigResponse>(async ({ parsedInput: { id, newRecordConfigDto }, ctx: { session } }) => {
    const { category, recordTypeId, label } = newRecordConfigDto;
    logMessage(
      "RR0028",
      `Updating record config with category ${category}, record type ID ${recordTypeId} and label ${label}`,
    );

    const recordConfig = await db.query.recordConfigs.findFirst({
      columns: { id: true },
      where: { id, organizationId: session.organization!.id },
    });
    if (!recordConfig) throw new RrActionError("Record config not found");

    const [updatedRecordConfig] = await db
      .update(table)
      .set(newRecordConfigDto)
      .where(eq(table.id, id))
      .returning(recordConfigsPublicCols);
    return updatedRecordConfig;
  });

export const generateRecordConfigsSF = actionClient
  .metadata({ auth: { useOrganization: true, orgPermissions: { recordConfigs: ["create-and-update"] } } })
  .inputSchema(
    z.strictObject({
      category: z.enum(RecordCategoryValues),
      prefix: z.string(),
    }),
  )
  .action<RecordConfigResponse[]>(async ({ parsedInput: { category, prefix }, ctx: { session } }) => {
    logMessage("RR0041", `Generating record configs for category ${category} with label prefix ${prefix}`);

    return await db
      .insert(table)
      .values(
        getRecordConfigsSet({
          organizationId: session.organization!.id,
          category,
          prefix,
        }),
      )
      .returning(recordConfigsPublicCols);
  });
