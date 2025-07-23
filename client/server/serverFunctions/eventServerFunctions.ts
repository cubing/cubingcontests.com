"use server";

import { z } from "zod/v4";
import { actionClient, CcActionError } from "../safeAction.ts";
import { EventValidator } from "~/helpers/validators/Event.ts";
import type { SelectEvent } from "~/server/db/schema/events.ts";
import { db } from "~/server/db/provider.ts";
import { eq, sql } from "drizzle-orm";
import { eventsTable as table } from "~/server/db/schema/events.ts";

export const createEventSF = actionClient.metadata({ permissions: { events: ["create"] } })
  .inputSchema(z.strictObject({
    newEvent: EventValidator,
  }))
  .action<SelectEvent[]>(async ({ parsedInput: { newEvent } }) => {
    const [sameIdEvent] = await db.select().from(table).where(eq(table.eventId, newEvent.eventId)).limit(1);
    if (sameIdEvent) throw new CcActionError(`Event with ID ${newEvent.eventId} already exists`);

    const [sameNameEvent] = await db.select().from(table).where(
      eq(sql`lower(${table.name})`, newEvent.name.toLowerCase()),
    ).limit(1);
    if (sameNameEvent) throw new CcActionError(`Event with name ${newEvent.name} already exists`);

    await db.insert(table).values(newEvent);

    return await db.select().from(table).orderBy(table.rank);
  });

export const updateEventSF = actionClient.metadata({ permissions: { events: ["update"] } })
  .inputSchema(z.strictObject({
    newEvent: EventValidator,
    originalEventId: z.string(),
  }))
  .action<SelectEvent[]>(async ({ parsedInput: { newEvent, originalEventId } }) => {
    const event = await this.eventModel.findOne({ eventId }).exec();
    if (!event) {
      throw new BadRequestException(`Event with ID ${eventId} does not exist`);
    }

    event.name = updateEventDto.name;
    event.rank = updateEventDto.rank;
    event.groups = updateEventDto.groups;
    event.description = updateEventDto.description;

    if (!updateEventDto.ruleText && event?.rule) {
      event.rule = undefined;
      await this.eventRuleModel.deleteOne({ eventId: updateEventDto.eventId })
        .exec();
    } else if (updateEventDto.ruleText && !event?.rule) {
      event.rule = await this.eventRuleModel.create({
        eventId: updateEventDto.eventId,
        rule: updateEventDto.ruleText,
      });
    } else if (updateEventDto.ruleText && event.rule) {
      await this.eventRuleModel
        .updateOne({ eventId: updateEventDto.eventId }, {
          eventId: updateEventDto.eventId,
          rule: updateEventDto.ruleText,
        })
        .exec();
    }

    const newId = updateEventDto.eventId;

    if (newId !== eventId) {
      const eventWithNewId = await this.eventModel.findOne({
        eventId: updateEventDto.eventId,
      }).exec();
      if (eventWithNewId) {
        throw new BadRequestException(
          `Event with ID ${updateEventDto.eventId} already exists`,
        );
      }

      event.eventId = newId;

      try {
        // Update rounds and schedules
        this.logger.log(
          `Updating rounds and schedules, changing event ID ${eventId} to ${newId}`,
        );

        for (let i = 1; i <= 10; i++) {
          const roundId = `${eventId}-r${i}`;
          const newRoundId = `${newId}-r${i}`;
          const res = await this.roundModel.updateMany({ roundId }, {
            $set: { roundId: newRoundId },
          }).exec();

          if (res.matchedCount > 0) {
            // TO-DO: UPDATE CHILD ACTIVITIES' CODES TOO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            const schedules = await this.scheduleModel.find({
              "venues.rooms.activities.activityCode": roundId,
            }).exec();

            for (const schedule of schedules) {
              // Keep in mind that one schedule can only have one occurrence of the same activity code
              venue_loop: for (const venue of schedule.venues) {
                for (const room of venue.rooms) {
                  for (const activity of room.activities) {
                    if (activity.activityCode === roundId) {
                      activity.activityCode = newRoundId;
                      await schedule.save();
                      break venue_loop;
                    }
                  }
                }
              }
            }
          }
        }

        // Update results
        this.logger.log(
          `Updating results, changing event ID ${eventId} to ${newId}`,
        );

        await this.resultModel.updateMany({ eventId }, {
          $set: { eventId: newId },
        }).exec();
      } catch (err) {
        throw new InternalServerErrorException(
          `Error while updating other collections when changing event ID ${eventId} to ${newId}:`,
          err.message,
        );
      }
    }

    await event.save();

    return await this.getFrontendEvents({ populateRules: true });
  });
