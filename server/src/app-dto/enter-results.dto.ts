import { ArrayMaxSize, ArrayMinSize, IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString, Min, Validate, ValidateNested } from 'class-validator';
import { AttemptDto, HasNonDnsResult } from '../modules/results/dto/create-result.dto';
import { Type } from 'class-transformer';
import { IAttempt } from '~~/client/shared_helpers/types';

export class EnterResultsDto {
  @IsString()
  @IsNotEmpty()
  competitionWcaId: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsNumberString()
  roundNumber: string;

  @ValidateNested({ each: true })
  results: ExternalResultDto[];
}

class ExternalResultDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  registrantId?: number;

  @IsOptional()
  @IsString()
  wcaId?: string;

  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @Validate(HasNonDnsResult)
  @ValidateNested({ each: true })
  @Type(() => AttemptDto)
  attempts: IAttempt[];
}
