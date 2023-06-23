import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventDocument } from '~/src/models/event.model';
import { CreateEventDto } from './dto/create-event.dto';
import eventsSeed from '~/src/seeds/events.seed';
import IEvent from '@sh/interfaces/IEvent';

@Injectable()
export class EventsService {
  constructor(@InjectModel('Event') private readonly model: Model<IEvent>) {}

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
      throw err;
    }
  }

  async getEvents() {
    try {
      const results: EventDocument[] = await this.model.find().exec();
      return results.map((el) => ({
        eventId: el.eventId,
        name: el.name,
        rank: el.rank,
        formatId: el.formatId,
      }));
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async createEvent(createEventDto: CreateEventDto) {
    const event: Event = await this.model.findOne({
      eventId: createEventDto.eventId,
    });

    if (event) {
      throw new BadRequestException(`Event with id ${createEventDto.eventId} already exists!`);
    }

    try {
      const newEvent = new this.model(createEventDto);
      await newEvent.save();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
