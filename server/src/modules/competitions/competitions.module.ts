import { Module } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { CompetitionsController } from './competitions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CompetitionSchema } from '~/src/models/competition.model';
import { RoundSchema } from '~/src/models/round.model';
import { ResultSchema } from '~/src/models/result.model';
import { RecordTypesModule } from '@m/record-types/record-types.module';
import { EventsModule } from '@m/events/events.module';
import { ResultsModule } from '@m/results/results.module';
import { PersonsModule } from '@m/persons/persons.module';
import { ScheduleSchema } from '~/src/models/schedule.model';

@Module({
  imports: [
    EventsModule,
    ResultsModule,
    RecordTypesModule,
    PersonsModule,
    MongooseModule.forFeature([
      { name: 'Competition', schema: CompetitionSchema },
      { name: 'Round', schema: RoundSchema },
      { name: 'Result', schema: ResultSchema },
      { name: 'Schedule', schema: ScheduleSchema },
    ]),
  ],
  controllers: [CompetitionsController],
  providers: [CompetitionsService],
})
export class CompetitionsModule {}
