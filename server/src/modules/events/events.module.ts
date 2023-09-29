import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsController } from './events.controller';
import { EventSchema } from '~/src/models/event.model';
import { ResultSchema } from '~/src/models/result.model';
import { RoundSchema } from '~/src/models/round.model';
import { ScheduleSchema } from '~/src/models/schedule.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Event', schema: EventSchema },
      { name: 'Round', schema: RoundSchema },
      { name: 'Result', schema: ResultSchema },
      { name: 'Schedule', schema: ScheduleSchema },
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
