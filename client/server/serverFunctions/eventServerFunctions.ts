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
    newEventDto: EventValidator,
  }))
  .action<SelectEvent>(async ({ parsedInput: { newEventDto } }) => {
    const [sameIdEvent] = await db.select().from(table).where(eq(table.eventId, newEventDto.eventId)).limit(1);
    if (sameIdEvent) throw new CcActionError(`Event with ID ${newEventDto.eventId} already exists`);

    const [sameNameEvent] = await db.select().from(table).where(
      eq(sql`lower(${table.name})`, newEventDto.name.toLowerCase()),
    ).limit(1);
    if (sameNameEvent) throw new CcActionError(`Event with name ${newEventDto.name} already exists`);

    const [createdEvent] = await db.insert(table).values(newEventDto).returning();
    return createdEvent;
  });

export const updateEventSF = actionClient.metadata({ permissions: { events: ["update"] } })
  .inputSchema(z.strictObject({
    newEventDto: EventValidator,
    originalEventId: z.string(),
  }))
  .action<SelectEvent>(async ({ parsedInput: { newEventDto, originalEventId } }) => {
    const [event] = await db.select().from(table).where(eq(table.eventId, originalEventId)).limit(1);
    if (!event) throw new CcActionError(`Event with ID ${originalEventId} not found`);

    const [updatedEvent] = await db.transaction(async (tx) => {
      if (newEventDto.eventId !== originalEventId) {
        const [sameIdEvent] = await tx.select().from(table).where(eq(table.eventId, newEventDto.eventId)).limit(1);
        if (sameIdEvent) throw new CcActionError(`Event with ID ${newEventDto.eventId} already exists`);

        await tx.update(collectiveSolutionsTable).set({ eventId: newEventDto.eventId }).where(
          eq(collectiveSolutionsTable.eventId, originalEventId),
        );

        console.log(`Updating rounds and schedules, changing event ID ${originalEventId} to ${newEventDto.eventId}`);

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
        console.log(`Updating results, changing event ID ${originalEventId} to ${newEventDto.eventId}`);

        // await this.resultModel.updateMany({ eventId }, {
        //   $set: { eventId: newId },
        // }).exec();
      }

      return await tx.update(table).set({
        eventId: newEventDto.eventId,
        name: newEventDto.name,
        rank: newEventDto.rank,
        category: newEventDto.category,
        submissionsAllowed: newEventDto.submissionsAllowed,
        removedWca: newEventDto.removedWca,
        hasMemo: newEventDto.hasMemo,
        hidden: newEventDto.hidden,
        description: newEventDto.description,
        rule: newEventDto.rule,
      }).where(eq(table.eventId, originalEventId)).returning();
    });

    return updatedEvent;
  });
