import { Module } from '@nestjs/common';
import { RecordTypesController } from './record-types.controller';
import { RecordTypesService } from './record-types.service';
import { RecordTypeSchema } from '~/src/models/record-type.model';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'RecordType', schema: RecordTypeSchema }])],
  controllers: [RecordTypesController],
  providers: [RecordTypesService],
  exports: [RecordTypesService],
})
export class RecordTypesModule {}
