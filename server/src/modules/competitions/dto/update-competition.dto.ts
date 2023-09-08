import { IsEnum, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateCompetitionDto } from './create-competition.dto';
import { ContestState } from '@sh/enums';

export class UpdateCompetitionDto extends PartialType(CreateCompetitionDto) {
  @IsOptional()
  @IsEnum(ContestState)
  state?: ContestState;
}
