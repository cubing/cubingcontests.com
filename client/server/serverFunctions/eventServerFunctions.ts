"use server";

import { z } from "zod";
import { actionClient, CcActionError } from "../safeAction.ts";
import { EventValidator } from "~/helpers/validators/Event.ts";
import type { SelectEvent } from "~/server/db/schema/events.ts";
import { db } from "~/server/db/provider.ts";
import { eq, sql } from "drizzle-orm";
import { eventsTable as table } from "~/server/db/schema/events.ts";
import { collectiveSolutionsTable } from "../db/schema/collective-solutions.ts";

export const createEventSF = actionClient.metadata({ permissions: { events: ["create"] } })
  .inputSchema(z.strictObject({
    newEvent: EventValidator,
  }))
  .action<SelectEvent>(async ({ parsedInput: { newEvent } }) => {
    const [sameIdEvent] = await db.select().from(table).where(eq(table.eventId, newEvent.eventId)).limit(1);
    if (sameIdEvent) throw new CcActionError(`Event with ID ${newEvent.eventId} already exists`);

    const [sameNameEvent] = await db.select().from(table).where(
      eq(sql`lower(${table.name})`, newEvent.name.toLowerCase()),
    ).limit(1);
    if (sameNameEvent) throw new CcActionError(`Event with name ${newEvent.name} already exists`);

    const [createdEvent] = await db.insert(table).values(newEvent).returning();
    return createdEvent;
  });

export const updateEventSF = actionClient.metadata({ permissions: { events: ["update"] } })
  .inputSchema(z.strictObject({
    newEvent: EventValidator,
    originalEventId: z.string(),
  }))
  .action<SelectEvent>(async ({ parsedInput: { newEvent, originalEventId } }) => {
    const [event] = await db.select().from(table).where(eq(table.eventId, originalEventId)).limit(1);
    if (!event) throw new CcActionError(`Event with ID ${originalEventId} not found`);

    const [updatedEvent] = await db.transaction(async (tx) => {
      if (newEvent.eventId !== originalEventId) {
        const [sameIdEvent] = await tx.select().from(table).where(eq(table.eventId, newEvent.eventId)).limit(1);
        if (sameIdEvent) throw new CcActionError(`Event with ID ${newEvent.eventId} already exists`);

        await tx.update(collectiveSolutionsTable).set({ eventId: newEvent.eventId }).where(
          eq(collectiveSolutionsTable.eventId, originalEventId),
        );

        console.log(`Updating rounds and schedules, changing event ID ${originalEventId} to ${newEvent.eventId}`);

        // Update round IDs
        // for (let i = 1; i <= 10; i++) {
        //   const roundId = `${originalEventId}-r${i}`;
        //   const newRoundId = `${newEvent.eventId}-r${i}`;
        //   const res = await this.roundModel.updateMany({ roundId }, {
        //     $set: { roundId: newRoundId },
        //   }).exec();

        //   if (res.matchedCount > 0) {
        //     // TO-DO: UPDATE CHILD ACTIVITIES' CODES TOO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        //     const schedules = await this.scheduleModel.find({
        //       "venues.rooms.activities.activityCode": roundId,
        //     }).exec();

        //     for (const schedule of schedules) {
        //       // Keep in mind that one schedule can only have one occurrence of the same activity code
        //       venue_loop: for (const venue of schedule.venues) {
        //         for (const room of venue.rooms) {
        //           for (const activity of room.activities) {
        //             if (activity.activityCode === roundId) {
        //               activity.activityCode = newRoundId;
        //               await schedule.save();
        //               break venue_loop;
        //             }
        //           }
        //         }
        //       }
        //     }
        //   }
        // }

        // Update results
        console.log(`Updating results, changing event ID ${originalEventId} to ${newEvent.eventId}`);

        // await this.resultModel.updateMany({ eventId }, {
        //   $set: { eventId: newId },
        // }).exec();
      }

      return await tx.update(table).set({
        eventId: newEvent.eventId,
        name: newEvent.name,
        rank: newEvent.rank,
        category: newEvent.category,
        submissionsAllowed: newEvent.submissionsAllowed,
        removedWca: newEvent.removedWca,
        hasMemo: newEvent.hasMemo,
        hidden: newEvent.hidden,
        description: newEvent.description,
        rule: newEvent.rule,
      }).where(eq(table.eventId, originalEventId)).returning();
    });

    return updatedEvent;
  });
