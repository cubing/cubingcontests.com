import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema } from '~/src/models/event.model';
import { EventRuleSchema } from '~/src/models/event-rule.model';
import { ResultSchema } from '~/src/models/result.model';
import { RoundSchema } from '~/src/models/round.model';
import { ScheduleSchema } from '~/src/models/schedule.model';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { LoggerModule } from '@m/my-logger/my-logger.module';

@Module({
  imports: [
    LoggerModule,
    MongooseModule.forFeature([
      { name: 'Event', schema: EventSchema },
      { name: 'EventRule', schema: EventRuleSchema },
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
