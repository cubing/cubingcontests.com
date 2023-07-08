import { Module } from '@nestjs/common';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ResultSchema } from '~/src/models/result.model';
import { RecordTypesModule } from '@m/record-types/record-types.module';
import { EventsModule } from '@m/events/events.module';
import { PersonsModule } from '@m/persons/persons.module';

@Module({
  imports: [
    EventsModule,
    RecordTypesModule,
    PersonsModule,
    MongooseModule.forFeature([{ name: 'Result', schema: ResultSchema }]),
  ],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
