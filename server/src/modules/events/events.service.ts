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
  constructor(@InjectModel('Event') private readonly eventModel: Model<EventDocument>) {}

  async onModuleInit() {
    try {
      await this.eventModel.updateOne({ eventId: '333tbf' }, { $set: { eventId: '333-team-bld' } }).exec();
      await this.eventModel.updateOne({ eventId: '333tf' }, { $set: { eventId: '333-team-factory' } }).exec();
      await this.eventModel.updateOne({ eventId: '333ohbfr' }, { $set: { eventId: '333-oh-bld-team-relay' } }).exec();
      await this.eventModel.updateOne({ eventId: '333bf2mr' }, { $set: { eventId: '333bf-2-person-relay' } }).exec();
      await this.eventModel.updateOne({ eventId: '333bf3mr' }, { $set: { eventId: '333bf-3-person-relay' } }).exec();
      await this.eventModel.updateOne({ eventId: '333bf4mr' }, { $set: { eventId: '333bf-4-person-relay' } }).exec();
      await this.eventModel.updateOne({ eventId: '333bf8mr' }, { $set: { eventId: '333bf-8-person-relay' } }).exec();

      const events: EventDocument[] = await this.eventModel.find().exec();

      console.log('Seeding the events collection...');

      // Add new events from events seed
      for (const event of eventsSeed) {
        if (!events.some((ev) => ev.eventId === event.eventId)) {
          console.log(`Adding new event: ${event.eventId}`);
          await this.eventModel.create(event);
        } else {
          console.log(`Updating event ${event.eventId}`);
          await this.eventModel.updateOne({ eventId: event.eventId }, event);
        }
      }
    } catch (err) {
      throw new InternalServerErrorException(`Error while seeding events collection: ${err.message}`);
    }
  }

  async getEvents(eventIds?: string[]): Promise<EventDocument[]> {
    const queryFilter: any = { groups: { $ne: EventGroup.Hidden } };

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
      event = await this.eventModel.findOne({ eventId }, excl).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (!event) throw new NotFoundException(`Event with id ${eventId} not found`);

    return event;
  }

  async createEvent(createEventDto: CreateEventDto) {
    try {
      const event: EventDocument = await this.eventModel.findOne({ eventId: createEventDto.eventId }).exec();

      if (event) {
        throw new BadRequestException(`Event with id ${createEventDto.eventId} already exists`);
      }

      await this.eventModel.create(createEventDto);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
