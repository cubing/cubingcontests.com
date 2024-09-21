import { Module } from '@nestjs/common';
import { PersonsService } from './persons.service';
import { PersonsController } from './persons.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PersonSchema } from '~/src/models/person.model';
import { RoundSchema } from '~/src/models/round.model';
import { LoggerModule } from '@m/my-logger/my-logger.module';
import { ResultSchema } from '~/src/models/result.model';
import { ContestSchema } from '~/src/models/contest.model';

@Module({
  imports: [
    LoggerModule,
    MongooseModule.forFeature([
      { name: 'Person', schema: PersonSchema },
      { name: 'Round', schema: RoundSchema },
      { name: 'Result', schema: ResultSchema },
      { name: 'Competition', schema: ContestSchema },
    ]),
  ],
  controllers: [PersonsController],
  providers: [PersonsService],
  exports: [PersonsService],
})
export class PersonsModule {}
