import { PartialType } from '@nestjs/mapped-types';
import { CreateCompetitionDto } from './create-competition.dto';
import { IsOptional } from 'class-validator';
import IRound from '@sh/interfaces/Round';

export class UpdateCompetitionDto extends PartialType(CreateCompetitionDto) {
  // ADD VALIDATION(?)
  @IsOptional()
  events?: {
    eventId: string;
    rounds: IRound[];
  }[];
}
