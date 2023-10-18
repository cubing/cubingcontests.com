import {
  ArrayMinSize,
  ArrayMaxSize,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
  Max,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';
import { IAttempt, IResult } from '@sh/interfaces';
import { Type } from 'class-transformer';
import C from '@sh/constants';

// This is almost the same as HasNonDnfDnsResult in SubmitResultDto
@ValidatorConstraint({ name: 'HasNonDnsResult', async: false })
class HasNonDnsResult implements ValidatorConstraintInterface {
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

  @IsDateString({}, { message: 'Please enter a valid date' })
  date: Date;

  @IsOptional()
  @IsBoolean()
  unapproved: boolean;

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

  @IsOptional()
  @IsUrl({}, { message: 'Please enter a valid video link' })
  videoLink?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Please enter a valid discussion link' })
  discussionLink?: string;
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
