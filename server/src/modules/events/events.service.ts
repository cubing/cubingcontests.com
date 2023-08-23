import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventDocument } from '~/src/models/event.model';
import { CreateEventDto } from './dto/create-event.dto';
import { eventsSeed } from '~/src/seeds/events.seed';
import { excl } from '~/src/helpers/dbHelpers';
import { EventFormat, EventGroup } from '../../../../client/shared_helpers/enums';

@Injectable()
export class EventsService {
  constructor(@InjectModel('Event') private readonly model: Model<EventDocument>) {}

  // Executed before the app is bootstrapped
  async onModuleInit() {
    try {
      const events: EventDocument[] = await this.model.find().exec();

      console.log('Seeding the events table...');

      // TEMPORARY !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      // REMOVE UNNEEDED IMPORTS TOO
      for (const event of events) {
        event.meetupOnly = undefined;

        if (event.format === ('teamtime' as EventFormat)) {
          event.format = EventFormat.Time;
          event.participants = 2;
        }

        switch (event.eventId) {
        case '333mbf':
          event.groups = [EventGroup.WCA, EventGroup.SubmissionsAllowed];
          break;
        case '333tbf':
          if (event.rank !== 1000) {
            event.eventId = '333tbfo';
            event.name = '3x3x3 Team-Blind Old Style';
            event.rank = 3000;
            event.groups = [EventGroup.Removed, EventGroup.Team];
          }
          break;
        case 'fto':
          event.rank = 1010;
          event.groups = [EventGroup.Unofficial];
          break;
        case 'magic':
          event.rank = 1020;
          event.groups = [EventGroup.Unofficial];
          break;
        case 'mmagic':
          event.rank = 1030;
          event.groups = [EventGroup.Unofficial];
          break;
        case '333tf':
          event.rank = 1040;
          event.groups = [EventGroup.Unofficial, EventGroup.Team];
          break;
        case '333ft':
          event.rank = 1050;
          event.groups = [EventGroup.Unofficial];
          break;
        default:
          if (event.groups.length === 0) event.groups = [EventGroup.WCA];
          break;
        }

        await event.save();
      }

      // Add new events from events seed
      for (const newEvent of eventsSeed) {
        if (!events.some((ev) => ev.eventId === newEvent.eventId)) {
          console.log(`Adding new event: ${newEvent.eventId}`);
          await this.model.create(newEvent);
        }
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getEvents(eventIds?: string[]): Promise<EventDocument[]> {
    const queryFilter: any = eventIds ? { eventId: { $in: eventIds } } : {};

    try {
      return await this.model.find(queryFilter, excl).sort({ rank: 1 }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getEventById(eventId: string): Promise<EventDocument> {
    let event: EventDocument;

    try {
      event = await this.model.findOne({ eventId }, excl).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (!event) throw new NotFoundException(`Event with id ${eventId} not found`);

    return event;
  }

  async createEvent(createEventDto: CreateEventDto) {
    try {
      const event: EventDocument = await this.model.findOne({ eventId: createEventDto.eventId }).exec();

      if (event) {
        throw new BadRequestException(`Event with id ${createEventDto.eventId} already exists`);
      }

      await this.model.create(createEventDto);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
