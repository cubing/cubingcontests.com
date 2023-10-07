import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventDocument } from '~/src/models/event.model';
import { CreateEventDto } from './dto/create-event.dto';
import { eventsSeed } from '~/src/seeds/events.seed';
import { excl } from '~/src/helpers/dbHelpers';
import { EventGroup } from '@sh/enums';
import { UpdateEventDto } from './dto/update-event.dto';
import { RoundDocument } from '~/src/models/round.model';
import { ResultDocument } from '~/src/models/result.model';
import { ScheduleDocument } from '~/src/models/schedule.model';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel('Event') private readonly eventModel: Model<EventDocument>,
    @InjectModel('Round') private readonly roundModel: Model<RoundDocument>,
    @InjectModel('Result') private readonly resultModel: Model<ResultDocument>,
    @InjectModel('Schedule') private readonly scheduleModel: Model<ScheduleDocument>,
  ) {}

  async onModuleInit() {
    try {
      const events: EventDocument[] = await this.eventModel.find().exec();

      if (events.length === 0) {
        console.log('Seeding the events collection...');

        // Add new events from events seed
        for (const event of eventsSeed) {
          console.log(`Adding event: ${event.eventId}`);
          await this.eventModel.create(event);
        }
      }
    } catch (err) {
      throw new InternalServerErrorException(`Error while seeding events collection: ${err.message}`);
    }
  }

  async getEvents(
    {
      eventIds,
      includeHidden,
      excludeRemovedMiscAndHidden,
    }: { eventIds?: string[]; includeHidden?: boolean; excludeRemovedMiscAndHidden?: boolean } = {
      includeHidden: false,
      excludeRemovedMiscAndHidden: false,
    },
  ): Promise<EventDocument[]> {
    const queryFilter: any = {};

    if (excludeRemovedMiscAndHidden)
      queryFilter.groups = { $nin: [EventGroup.Removed, EventGroup.Miscellaneous, EventGroup.Hidden] };
    else if (!includeHidden) queryFilter.groups = { $ne: EventGroup.Hidden };
    if (eventIds) queryFilter.eventId = { $in: eventIds };

    try {
      return await this.eventModel.find(queryFilter, excl).sort({ rank: 1 }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getSubmissionBasedEvents(): Promise<EventDocument[]> {
    try {
      return await this.eventModel
        .find({ groups: { $in: [EventGroup.ExtremeBLD, EventGroup.SubmissionsAllowed] } }, excl)
        .sort({ rank: 1 })
        .exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getEventById(eventId: string): Promise<EventDocument> {
    let event: EventDocument;

    try {
      event = await this.eventModel.findOne({ eventId }, excl).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (!event) throw new NotFoundException(`Event with id ${eventId} not found`);

    return event;
  }

  async createEvent(createEventDto: CreateEventDto): Promise<EventDocument[]> {
    const event = await this.eventModel.findOne({ eventId: createEventDto.eventId }).exec();
    if (event) throw new BadRequestException(`Event with id ${createEventDto.eventId} already exists`);

    const eventWithSameRank = await this.eventModel.findOne({ rank: createEventDto.rank }).exec();
    if (eventWithSameRank) throw new BadRequestException(`Event with rank ${createEventDto.rank} already exists`);

    await this.eventModel.create(createEventDto);

    return await this.getEvents({ includeHidden: true });
  }

  async updateEvent(eventId: string, updateEventDto: UpdateEventDto): Promise<EventDocument[]> {
    const eventWithSameRank = await this.eventModel
      .findOne({ eventId: { $ne: eventId }, rank: updateEventDto.rank })
      .exec();
    if (eventWithSameRank) throw new BadRequestException(`Event with rank ${updateEventDto.rank} already exists`);

    const event = await this.eventModel.findOne({ eventId }).exec();
    if (!event) throw new BadRequestException(`Event with id ${eventId} does not exist`);

    event.name = updateEventDto.name;
    event.rank = updateEventDto.rank;
    event.groups = updateEventDto.groups;
    event.description = updateEventDto.description;

    const newId = updateEventDto.eventId;

    if (newId !== eventId) {
      const eventWithNewId = await this.eventModel.findOne({ eventId: updateEventDto.eventId }).exec();
      if (eventWithNewId) throw new BadRequestException(`Event with id ${updateEventDto.eventId} already exists`);

      event.eventId = newId;

      try {
        // Update rounds and schedules
        console.log(`Updating rounds and schedules, changing event id ${eventId} to ${newId}`);

        for (let i = 1; i <= 10; i++) {
          const roundId = `${eventId}-r${i}`;
          const newRoundId = `${newId}-r${i}`;
          const res = await this.roundModel.updateMany({ roundId }, { $set: { roundId: newRoundId } }).exec();

          if (res.matchedCount > 0) {
            // TO-DO: UPDATE CHILD ACTIVITIES' CODES TOO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            const schedules = await this.scheduleModel.find({ 'venues.rooms.activities.activityCode': roundId }).exec();

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
        console.log(`Updating results, changing event id ${eventId} to ${newId}`);

        await this.resultModel.updateMany({ eventId }, { $set: { eventId: newId } }).exec();
      } catch (err) {
        throw new InternalServerErrorException(
          `Error while updating other collections when changing event id ${eventId} to ${newId}:`,
          err.message,
        );
      }
    }

    try {
      await event.save();
    } catch (err) {
      throw new InternalServerErrorException(`Error while saving event ${eventId}: ${err.message}`);
    }

    return await this.getEvents({ includeHidden: true });
  }
}
