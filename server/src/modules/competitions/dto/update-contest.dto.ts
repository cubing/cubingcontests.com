import { IsEnum, IsOptional } from 'class-validator';
import { CreateContestDto } from './create-contest.dto';
import { ContestState } from '@sh/enums';

// This doesn't use the partial extend, because whenever a contest is updated, all of its details are sent to the backend
export class UpdateContestDto extends CreateContestDto {
  @IsOptional()
  @IsEnum(ContestState)
  state?: ContestState;
}
