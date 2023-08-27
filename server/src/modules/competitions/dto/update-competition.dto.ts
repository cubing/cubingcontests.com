import { IsEnum, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateCompetitionDto } from './create-competition.dto';
import { CompetitionState } from '@sh/enums';

export class UpdateCompetitionDto extends PartialType(CreateCompetitionDto) {
  @IsOptional()
  @IsEnum(CompetitionState)
  state?: CompetitionState;
}
