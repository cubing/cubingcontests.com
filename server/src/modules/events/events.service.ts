import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventDocument } from '~/src/models/event.model';
import { CreateEventDto } from './dto/create-event.dto';
import { eventsSeed } from '~/src/seeds/events.seed';
import { excl } from '~/src/helpers/dbHelpers';
import { EventGroup } from '@sh/enums';

@Injectable()
export class EventsService {
  constructor(@InjectModel('Event') private readonly model: Model<EventDocument>) {}

  async onModuleInit() {
    try {
      const events: EventDocument[] = await this.model.find().exec();

      console.log('Seeding the events table...');

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

  async getSubmissionBasedEvents(): Promise<EventDocument[]> {
    try {
      return await this.model
        .find({ groups: { $in: [EventGroup.SubmissionOnly, EventGroup.SubmissionsAllowed] } }, excl)
        .sort({ rank: 1 })
        .exec();
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
