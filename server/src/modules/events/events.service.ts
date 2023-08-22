import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventDocument } from '~/src/models/event.model';
import { CreateEventDto } from './dto/create-event.dto';
import { eventsSeed } from '~/src/seeds/events.seed';
import { excl } from '~/src/helpers/dbHelpers';

@Injectable()
export class EventsService {
  constructor(@InjectModel('Event') private readonly model: Model<EventDocument>) {}

  // Executed before the app is bootstrapped
  async onModuleInit() {
    try {
      const events: EventDocument[] = await this.model.find().exec();

      if (events.length === 0) {
        console.log('Seeding the events table...');

        await this.model.insertMany(eventsSeed);

        console.log('Events table successfully seeded');
      } else {
        console.log('Events table already seeded');

        // TEMPORARY !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        for (const event of events) {
          if (event.meetupOnly === false) {
            event.meetupOnly = undefined;
            await event.save();
          }
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
      const event: EventDocument = await this.model
        .findOne({
          eventId: createEventDto.eventId,
        })
        .exec();

      if (event) {
        throw new BadRequestException(`Event with id ${createEventDto.eventId} already exists`);
      }

      await this.model.create(createEventDto);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
