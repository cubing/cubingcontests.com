"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { IS_CUBING_CONTESTS_INSTANCE } from "~/helpers/constants.ts";
import { EventValidator } from "~/helpers/validators/Event.ts";
import { db } from "~/server/db/provider.ts";
import { collectiveSolutionsTable } from "~/server/db/schema/collective-solutions.ts";
import { contestsTable } from "~/server/db/schema/contests.ts";
import { eventCategoryDetailsColumns } from "~/server/db/schema/event-categories.ts";
import type { FullEvent } from "~/server/db/schema/events.ts";
import { eventsTable as table } from "~/server/db/schema/events.ts";
import { sendEmail } from "~/server/email/mailer.ts";
import { logMessage } from "~/server/server-only-functions/server-only-functions.ts";
import { actionClient, RrActionError } from "../safe-action.ts";

export const createEventSF = actionClient
  .metadata({ auth: { useOrganization: true, orgPermissions: { events: ["create"] } } })
  .inputSchema(
    z.strictObject({
      newEventDto: EventValidator,
    }),
  )
  .action<FullEvent>(async ({ parsedInput: { newEventDto }, ctx: { session } }) => {
    logMessage("RR0002", `Creating new event with ID ${newEventDto.eventId}`);

    const [sameNameEvent] = await db
      .select()
      .from(table)
      .where(
        and(
          eq(table.organizationId, session.organization!.id),
          eq(sql`LOWER(${table.name})`, newEventDto.name.toLowerCase()),
        ),
      )
      .limit(1);
    if (sameNameEvent) throw new RrActionError(`Event with name ${newEventDto.name} already exists`);

    const category = await db.query.eventCategories.findFirst({
      columns: eventCategoryDetailsColumns,
      where: { organizationId: session.organization!.id, id: newEventDto.categoryId },
    });
    if (!category) throw new RrActionError("Event category not found");

    const [createdEvent] = await db
      .insert(table)
      .values({ ...newEventDto, organizationId: session.organization!.id })
      .returning();

    if (IS_CUBING_CONTESTS_INSTANCE) {
      sendEmail(
        session.organization!.metadata.contactEmail,
        "Important: Event created",
        `A new event has been created:\n\n${JSON.stringify(createdEvent, null, 2)}`,
      );
    }

    return { ...createdEvent, category };
  });

export const updateEventSF = actionClient
  .metadata({ auth: { useOrganization: true, orgPermissions: { events: ["update"] } } })
  .inputSchema(
    z.strictObject({
      originalEventId: z.string(),
      newEventDto: EventValidator,
    }),
  )
  .action<FullEvent>(async ({ parsedInput: { originalEventId, newEventDto }, ctx: { session } }) => {
    const isNewId = newEventDto.eventId !== originalEventId;
    logMessage(
      "RR0003",
      `Updating event with ID ${newEventDto.eventId}${isNewId ? ` (new event ID: ${newEventDto.eventId})` : ""}`,
    );

    const [event, category] = await Promise.all([
      db.query.events.findFirst({ where: { organizationId: session.organization!.id, eventId: originalEventId } }),
      db.query.eventCategories.findFirst({
        columns: eventCategoryDetailsColumns,
        where: { organizationId: session.organization!.id, id: newEventDto.categoryId },
      }),
    ]);

    if (!category) throw new RrActionError("Event category not found");
    if (!event) throw new RrActionError(`Event with ID ${originalEventId} not found`);

    const [updatedEvent] = await db.transaction(async (tx) => {
      if (isNewId) {
        if (session.organization!.id === "default") {
          await tx
            .update(collectiveSolutionsTable)
            .set({ eventId: newEventDto.eventId })
            .where(eq(collectiveSolutionsTable.eventId, originalEventId));
        }

        const roundsWithEvent = await tx.query.rounds.findMany({
          columns: { competitionId: true },
          where: { organizationId: session.organization!.id, eventId: originalEventId },
        });
        const competitionIds = new Set<string>(roundsWithEvent.map((r) => r.competitionId));

        if (competitionIds.size > 0) {
          const contestsWithEventInTheSchedule = await tx.query.contests.findMany({
            columns: { id: true, schedule: true },
            where: {
              organizationId: session.organization!.id,
              schedule: { isNotNull: true },
              competitionId: { in: Array.from(competitionIds) },
            },
          });

          const activityCodeRegex = new RegExp(`^${originalEventId}(-r[1-9][0-9]?(-g[1-9][0-9]?(-a[1-9][0-9]?)?)?)?$`);
          for (const { id, schedule } of contestsWithEventInTheSchedule) {
            let isChanged = false;
            for (const venue of schedule!.venues) {
              for (const room of venue.rooms) {
                // TO-DO: ADD SUPPORT FOR CHILD ACTIVITIES!!!
                for (const activity of room.activities) {
                  if (activityCodeRegex.test(activity.activityCode)) {
                    activity.activityCode = activity.activityCode.replace(
                      new RegExp(`^${originalEventId}`),
                      newEventDto.eventId,
                    );
                    isChanged = true;
                  }
                }
              }
            }
            if (isChanged) await tx.update(contestsTable).set({ schedule }).where(eq(contestsTable.id, id));
          }
        }
      }

      return await tx
        .update(table)
        .set({
          eventId: newEventDto.eventId,
          name: newEventDto.name,
          rank: newEventDto.rank,
          categoryId: newEventDto.categoryId,
          submissionsAllowed: newEventDto.submissionsAllowed,
          hasMemo: newEventDto.hasMemo,
          hidden: newEventDto.hidden,
          description: newEventDto.description,
          rule: newEventDto.rule,
          importantInfo: newEventDto.importantInfo,
        })
        .where(eq(table.id, event.id))
        .returning();
    });

    return { ...updatedEvent, category };
  });
