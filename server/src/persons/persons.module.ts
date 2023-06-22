import { Module } from '@nestjs/common';
import { PersonsService } from './persons.service';
import { PersonsController } from './persons.controller';
import { MongooseModule } from '@nestjs/mongoose';
import PersonSchema from '~/src/models/person.model';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Person', schema: PersonSchema }])],
  controllers: [PersonsController],
  providers: [PersonsService],
})
export class PersonsModule {}
