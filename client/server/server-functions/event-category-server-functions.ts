"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { EventCategoryValidator } from "~/helpers/validators/EventCategory.ts";
import { db } from "~/server/db/provider.ts";
import type { SelectEventCategory } from "~/server/db/schema/event-categories.ts";
import { eventCategoriesTable as table } from "~/server/db/schema/event-categories.ts";
import { logMessage } from "~/server/server-only-functions/server-only-functions.ts";
import { actionClient, RrActionError } from "../safe-action.ts";

export const createEventCategorySF = actionClient
  .metadata({ auth: { useOrganization: true, orgPermissions: { events: ["create", "update"] } } })
  .inputSchema(
    z.strictObject({
      newEventCategoryDto: EventCategoryValidator,
    }),
  )
  .action<SelectEventCategory>(async ({ parsedInput: { newEventCategoryDto }, ctx: { session } }) => {
    logMessage("RR0050", `Creating new event category: ${newEventCategoryDto.name}`);

    const [created] = await db
      .insert(table)
      .values({ ...newEventCategoryDto, organizationId: session.organization!.id })
      .returning();

    return created;
  });

export const updateEventCategorySF = actionClient
  .metadata({ auth: { useOrganization: true, orgPermissions: { events: ["create", "update"] } } })
  .inputSchema(
    z.strictObject({
      id: z.int(),
      newEventCategoryDto: EventCategoryValidator,
    }),
  )
  .action<SelectEventCategory>(async ({ parsedInput: { id, newEventCategoryDto }, ctx: { session } }) => {
    logMessage("RR0051", `Updating event category with ID ${id}`);

    const [existing] = await db
      .select()
      .from(table)
      .where(and(eq(table.organizationId, session.organization!.id), eq(table.id, id)))
      .limit(1);
    if (!existing) throw new RrActionError(`Event category with ID ${id} not found`);

    const [updated] = await db.update(table).set(newEventCategoryDto).where(eq(table.id, id)).returning();

    return updated;
  });
