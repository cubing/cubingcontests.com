import { Module } from '@nestjs/common';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ResultSchema } from '~/src/models/result.model';
import { RoundSchema } from '~/src/models/round.model';
import { CompetitionSchema } from '~/src/models/competition.model';
import { RecordTypesModule } from '@m/record-types/record-types.module';
import { EventsModule } from '@m/events/events.module';
import { PersonsModule } from '@m/persons/persons.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    EventsModule,
    RecordTypesModule,
    PersonsModule,
    AuthModule,
    MongooseModule.forFeature([
      { name: 'Result', schema: ResultSchema },
      { name: 'Round', schema: RoundSchema },
      { name: 'Competition', schema: CompetitionSchema },
    ]),
  ],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
