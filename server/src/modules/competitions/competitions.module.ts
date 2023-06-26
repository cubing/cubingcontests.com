import { Module } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { CompetitionsController } from './competitions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CompetitionSchema } from '~/src/models/competition.model';
import { RoundSchema } from '~/src/models/round.model';
import { EventSchema } from '~/src/models/event.model';
import { PersonSchema } from '~/src/models/person.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Competition', schema: CompetitionSchema },
      { name: 'Round', schema: RoundSchema },
      { name: 'Event', schema: EventSchema },
      { name: 'Person', schema: PersonSchema },
    ]),
  ],
  controllers: [CompetitionsController],
  providers: [CompetitionsService],
})
export class CompetitionsModule {}
