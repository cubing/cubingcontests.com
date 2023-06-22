import { Module } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { CompetitionsController } from './competitions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import CompetitionSchema from '~/src/models/competition.model';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Competition', schema: CompetitionSchema }])],
  controllers: [CompetitionsController],
  providers: [CompetitionsService],
})
export class CompetitionsModule {}
