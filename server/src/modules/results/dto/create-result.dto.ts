import {
  ArrayMinSize,
  ArrayMaxSize,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  Max,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';
import { IAttempt, IResult } from '@sh/types';
import { Type } from 'class-transformer';
import C from '@sh/constants';
import { DATE_VALIDATION_MSG } from '~/src/helpers/messages';

// This is almost the same as HasNonDnfDnsResult in SubmitResultDto
@ValidatorConstraint({ name: 'HasNonDnsResult', async: false })
export class HasNonDnsResult implements ValidatorConstraintInterface {
  validate(attempts: IAttempt[]) {
    return attempts.some((a) => a.result !== -2);
  }

  defaultMessage() {
    return 'You cannot submit only DNS results';
  }
}

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

  @IsOptional()
  @IsBoolean()
  unapproved?: boolean;

  @ArrayMinSize(1)
  @IsInt({ each: true })
  personIds: number[];

  @IsOptional()
  @IsInt()
  ranking?: number;

  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @Validate(HasNonDnsResult)
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

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(C.maxTime - 1)
  memo?: number;
}
