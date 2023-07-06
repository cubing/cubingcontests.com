import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventDocument } from '~/src/models/event.model';
import { CreateEventDto } from './dto/create-event.dto';
import eventsSeed from '~/src/seeds/events.seed';
import { excl } from '~/src/helpers/dbHelpers';

@Injectable()
export class EventsService {
  constructor(@InjectModel('Event') private readonly model: Model<EventDocument>) {}

  // Executed before the app is bootstrapped
  async onModuleInit() {
    try {
      const results: EventDocument[] = await this.model.find().exec();

      if (results.length === 0) {
        console.log('Seeding the events table...');

        await this.model.insertMany(eventsSeed);

        console.log('Events table successfully seeded');
      } else {
        console.log('Events table already seeded');
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getEvents(): Promise<EventDocument[]> {
    try {
      return await this.model.find({}, excl).sort({ rank: 1 }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
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

      const newEvent = new this.model(createEventDto);
      await newEvent.save();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
