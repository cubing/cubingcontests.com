import { Module } from '@nestjs/common';
import { RecordTypesController } from './record-types.controller';
import { RecordTypesService } from './record-types.service';
import { RecordTypeSchema } from '~/src/models/record-type.model';
import { MongooseModule } from '@nestjs/mongoose';
import { ResultSchema } from '~/src/models/result.model';
import { EventSchema } from '~/src/models/event.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'RecordType', schema: RecordTypeSchema },
      { name: 'Result', schema: ResultSchema },
      { name: 'Event', schema: EventSchema },
    ]),
  ],
  controllers: [RecordTypesController],
  providers: [RecordTypesService],
  exports: [RecordTypesService],
})
export class RecordTypesModule {}
