import { Module } from '@nestjs/common';
import { PersonsService } from './persons.service';
import { PersonsController } from './persons.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PersonSchema } from '~/src/models/person.model';
import { RoundSchema } from '~/src/models/round.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Person', schema: PersonSchema },
      { name: 'Round', schema: RoundSchema },
    ]),
  ],
  controllers: [PersonsController],
  providers: [PersonsService],
  exports: [PersonsService],
})
export class PersonsModule {}
