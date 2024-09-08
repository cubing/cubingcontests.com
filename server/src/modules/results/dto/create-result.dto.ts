import {
  ArrayMinSize,
  ArrayMaxSize,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  Max,
  Validate,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IAttempt, IResult } from '@sh/types';
import C from '@sh/constants';
import { DATE_VALIDATION_MSG } from '~/src/helpers/messages';
import { ContestAttempts } from '~/src/helpers/customValidators';

export class CreateResultDto implements IResult {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  competitionId?: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsDateString({}, { message: DATE_VALIDATION_MSG })
  date: Date;

  @ArrayMinSize(1)
  @IsInt({ each: true })
  personIds: number[];

  @IsOptional()
  @IsInt()
  ranking?: number;

  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @Validate(ContestAttempts)
  @ValidateNested({ each: true })
  @Type(() => AttemptDto)
  attempts: IAttempt[];

  @IsInt()
  best: number;

  @IsInt()
  average: number;
}

export class AttemptDto implements IAttempt {
  @IsInt()
  result: number;

  @ValidateIf((_, value) => value !== undefined) // this is different from @IsOptional(), because that also allows null
  @IsInt()
  @Min(1)
  @Max(C.maxTime - 1)
  memo?: number;
}
