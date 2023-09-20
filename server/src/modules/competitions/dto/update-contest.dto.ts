import { IsEnum, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateContestDto } from './create-contest.dto';
import { ContestState } from '@sh/enums';

export class UpdateContestDto extends PartialType(CreateContestDto) {
  @IsOptional()
  @IsEnum(ContestState)
  state?: ContestState;
}
