import { Module } from '@nestjs/common';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ResultSchema } from '~/src/models/result.model';
import { RoundSchema } from '~/src/models/round.model';
import { ContestSchema } from '~/src/models/contest.model';
import { RecordTypesModule } from '@m/record-types/record-types.module';
import { EventsModule } from '@m/events/events.module';
import { PersonsModule } from '@m/persons/persons.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    EventsModule,
    RecordTypesModule,
    PersonsModule,
    AuthModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: 'Result', schema: ResultSchema },
      { name: 'Round', schema: RoundSchema },
      { name: 'Competition', schema: ContestSchema },
    ]),
  ],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
