import { Module } from '@nestjs/common';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ResultSchema } from '~/src/models/result.model';
import { RoundSchema } from '~/src/models/round.model';
import { ContestSchema } from '~/src/models/contest.model';
import { ScheduleSchema } from '~/src/models/schedule.model';
import { LoggerModule } from '@m/my-logger/my-logger.module';
import { RecordTypesModule } from '@m/record-types/record-types.module';
import { EventsModule } from '@m/events/events.module';
import { PersonsModule } from '@m/persons/persons.module';
import { UsersModule } from '@m/users/users.module';
import { EmailModule } from '@m/email/email.module';

@Module({
  imports: [
    LoggerModule,
    EventsModule,
    RecordTypesModule,
    PersonsModule,
    UsersModule,
    EmailModule,
    MongooseModule.forFeature([
      { name: 'Result', schema: ResultSchema },
      { name: 'Round', schema: RoundSchema },
      { name: 'Competition', schema: ContestSchema },
      { name: 'Schedule', schema: ScheduleSchema },
    ]),
  ],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
