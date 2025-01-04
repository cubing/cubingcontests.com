import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MyLogger } from "@m/my-logger/my-logger.service";
import { EventDocument } from "~/src/models/event.model";
import { CreateEventDto } from "./dto/create-event.dto";
import { eventsSeed } from "~/src/seeds/events.seed";
import { excl } from "~/src/helpers/dbHelpers";
import { EventGroup } from "~/shared/enums";
import { FeEvent } from "~/shared/types";
import { UpdateEventDto } from "./dto/update-event.dto";
import { RoundDocument } from "~/src/models/round.model";
import { ResultDocument } from "~/src/models/result.model";
import { ScheduleDocument } from "~/src/models/schedule.model";
import { EventRuleDocument } from "~/src/models/event-rule.model";

interface IGetEventsOptions {
  eventIds?: string[];
  includeHidden?: boolean;
  excludeRemovedAndHidden?: boolean;
  populateRules?: boolean;
}

@Injectable()
export class EventsService {
  constructor(
    private readonly logger: MyLogger,
    @InjectModel("Event") private readonly eventModel: Model<EventDocument>,
    @InjectModel("EventRule") private readonly eventRuleModel: Model<EventRuleDocument>,
    @InjectModel("Round") private readonly roundModel: Model<RoundDocument>,
    @InjectModel("Result") private readonly resultModel: Model<ResultDocument>,
    @InjectModel("Schedule") private readonly scheduleModel: Model<ScheduleDocument>,
  ) {}

  async onModuleInit() {
    const anyEvent = await this.eventModel.findOne().exec();

    if (!anyEvent) {
      this.logger.log("Seeding the events collection...");

      // Add new events from events seed
      for (const event of eventsSeed) {
        this.logger.log(`Adding event: ${event.eventId}`);
        await this.eventModel.create(event);
      }
    }
  }

  async getEvents(
    { eventIds, includeHidden, excludeRemovedAndHidden, populateRules = false }: IGetEventsOptions = {
      includeHidden: false,
      excludeRemovedAndHidden: false,
      populateRules: false,
    },
  ): Promise<EventDocument[]> {
    const queryFilter: any = {};

    if (excludeRemovedAndHidden) queryFilter.groups = { $nin: [EventGroup.Removed, EventGroup.Hidden] };
    else if (!includeHidden) queryFilter.groups = { $ne: EventGroup.Hidden };
    if (eventIds) queryFilter.eventId = { $in: eventIds };

    let query = this.eventModel.find(queryFilter, excl);
    if (populateRules) query = query.populate({ path: "rule", model: "EventRule" });

    return await query.sort({ rank: 1 }).exec();
  }

  async getFrontendEvents(
    options: IGetEventsOptions = { includeHidden: false, populateRules: false },
  ): Promise<FeEvent[]> {
    const events = await this.getEvents(options);

    const frontendEvents = events.map((event) => {
      const { rule: eventRule, ...rest } = event.toObject();
      if (!eventRule) return rest;
      return { ...rest, ruleText: eventRule.rule };
    });

    return frontendEvents;
  }

  async getSubmissionBasedEvents(): Promise<EventDocument[]> {
    return await this.eventModel
      .find({ groups: { $in: [EventGroup.ExtremeBLD, EventGroup.SubmissionsAllowed] } }, excl)
      .sort({ rank: 1 })
      .exec();
  }

  async getEventById(eventId: string): Promise<EventDocument> {
    const event = await this.eventModel.findOne({ eventId }, excl).exec();
    if (!event) throw new NotFoundException(`Event with ID ${eventId} not found`);
    return event;
  }

  async createEvent(createEventDto: CreateEventDto): Promise<FeEvent[]> {
    const event = await this.eventModel.findOne({ eventId: createEventDto.eventId }).exec();
    if (event) throw new BadRequestException(`Event with ID ${createEventDto.eventId} already exists`);

    const eventWithSameName = await this.eventModel
      .findOne({ name: { $regex: createEventDto.name, $options: "i" } })
      .exec();
    if (eventWithSameName) throw new BadRequestException(`Event with name ${createEventDto.name} already exists`);

    const { ruleText, ...newEvent }: FeEvent = createEventDto;
    let eventRule: EventRuleDocument;

    if (ruleText) eventRule = await this.eventRuleModel.create({ eventId: newEvent.eventId, rule: ruleText });

    await this.eventModel.create({ ...newEvent, rule: eventRule });

    return await this.getFrontendEvents({ includeHidden: true, populateRules: true });
  }

  async updateEvent(eventId: string, updateEventDto: UpdateEventDto): Promise<FeEvent[]> {
    const event = await this.eventModel.findOne({ eventId }).exec();
    if (!event) throw new BadRequestException(`Event with ID ${eventId} does not exist`);

    event.name = updateEventDto.name;
    event.rank = updateEventDto.rank;
    event.groups = updateEventDto.groups;
    event.description = updateEventDto.description;

    if (!updateEventDto.ruleText && event?.rule) {
      event.rule = undefined;
      await this.eventRuleModel.deleteOne({ eventId: updateEventDto.eventId }).exec();
    } else if (updateEventDto.ruleText && !event?.rule) {
      event.rule = await this.eventRuleModel.create({ eventId: updateEventDto.eventId, rule: updateEventDto.ruleText });
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
      const eventWithNewId = await this.eventModel.findOne({ eventId: updateEventDto.eventId }).exec();
      if (eventWithNewId) throw new BadRequestException(`Event with ID ${updateEventDto.eventId} already exists`);

      event.eventId = newId;

      try {
        // Update rounds and schedules
        this.logger.log(`Updating rounds and schedules, changing event ID ${eventId} to ${newId}`);

        for (let i = 1; i <= 10; i++) {
          const roundId = `${eventId}-r${i}`;
          const newRoundId = `${newId}-r${i}`;
          const res = await this.roundModel.updateMany({ roundId }, { $set: { roundId: newRoundId } }).exec();

          if (res.matchedCount > 0) {
            // TO-DO: UPDATE CHILD ACTIVITIES' CODES TOO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            const schedules = await this.scheduleModel.find({ "venues.rooms.activities.activityCode": roundId }).exec();

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
        this.logger.log(`Updating results, changing event ID ${eventId} to ${newId}`);

        await this.resultModel.updateMany({ eventId }, { $set: { eventId: newId } }).exec();
      } catch (err) {
        throw new InternalServerErrorException(
          `Error while updating other collections when changing event ID ${eventId} to ${newId}:`,
          err.message,
        );
      }
    }

    await event.save();

    return await this.getFrontendEvents({ includeHidden: true, populateRules: true });
  }

  async getEventsWithRules(): Promise<FeEvent[]> {
    const eventRules = await this.eventRuleModel.find();

    return await this.getFrontendEvents({
      eventIds: eventRules.map((er) => er.eventId),
      includeHidden: false,
      populateRules: true,
    });
  }
}
