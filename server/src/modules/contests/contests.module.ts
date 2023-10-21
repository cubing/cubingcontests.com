import { Module } from '@nestjs/common';
import { LoggerModule } from '@m/my-logger/my-logger.module';
import { ContestsService } from './contests.service';
import { ContestsController } from './contests.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ContestSchema } from '~/src/models/contest.model';
import { RoundSchema } from '~/src/models/round.model';
import { ResultSchema } from '~/src/models/result.model';
import { RecordTypesModule } from '@m/record-types/record-types.module';
import { EventsModule } from '@m/events/events.module';
import { ResultsModule } from '@m/results/results.module';
import { PersonsModule } from '@m/persons/persons.module';
import { ScheduleSchema } from '~/src/models/schedule.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    LoggerModule,
    EventsModule,
    ResultsModule,
    RecordTypesModule,
    PersonsModule,
    AuthModule,
    MongooseModule.forFeature([
      { name: 'Competition', schema: ContestSchema },
      { name: 'Round', schema: RoundSchema },
      { name: 'Result', schema: ResultSchema },
      { name: 'Schedule', schema: ScheduleSchema },
    ]),
  ],
  controllers: [ContestsController],
  providers: [ContestsService],
})
export class ContestsModule {}
