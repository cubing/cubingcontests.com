import { IsEnum } from 'class-validator';
// import { PartialType } from '@nestjs/mapped-types';
import { CreateCompetitionDto } from './create-competition.dto';
import { CompetitionState, CompetitionType } from '@sh/enums';

// export class UpdateCompetitionDto extends PartialType(CreateCompetitionDto) {
export class UpdateCompetitionDto extends CreateCompetitionDto {
  @IsEnum(CompetitionType)
  state: CompetitionState;
}
