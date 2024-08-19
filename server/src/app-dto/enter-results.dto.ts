import {
  ArrayMaxSize,
  ArrayMinSize,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  Validate,
  ValidateNested,
} from 'class-validator';
import { AttemptDto, HasNonDnsResult } from '../modules/results/dto/create-result.dto';
import { Type } from 'class-transformer';
import { IAttempt } from '@sh/types';
import C from '@sh/constants';

export class EnterResultsDto {
  @IsString()
  @IsNotEmpty()
  competitionWcaId: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsNumber()
  roundNumber: number;

  @ValidateNested({ each: true })
  results: ExternalResultDto[];
}

export class ExternalResultDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  registrantId?: number;

  @IsOptional()
  @Matches(C.wcaIdRegexLoose, { message: '$value is not a valid WCA ID.' })
  @IsString()
  wcaId?: string;

  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @Validate(HasNonDnsResult)
  @ValidateNested({ each: true })
  @Type(() => AttemptDto)
  attempts: IAttempt[];
}
