import { IAttempt, IResult } from '@sh/types';
import { AttemptDto, CreateResultDto } from './create-result.dto';
import {
  ArrayMaxSize,
  ArrayMinSize,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Type } from 'class-transformer';

@ValidatorConstraint({ name: 'HasNonDnfDnsResult', async: false })
class HasNonDnfDnsResult implements ValidatorConstraintInterface {
  validate(attempts: IAttempt[]) {
    return attempts.some((a) => a.result > 0);
  }

  defaultMessage() {
    return 'You cannot submit only DNF/DNS results';
  }
}

export class SubmitResultDto extends CreateResultDto implements IResult {
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @Validate(HasNonDnfDnsResult)
  @ValidateNested({ each: true })
  @Type(() => AttemptDto)
  attempts: IAttempt[];
}
