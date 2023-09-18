import { IsEnum, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateContestDto } from './create-competition.dto';
import { ContestState } from '@sh/enums';

export class UpdateCompetitionDto extends PartialType(CreateContestDto) {
  @IsOptional()
  @IsEnum(ContestState)
  state?: ContestState;
}
