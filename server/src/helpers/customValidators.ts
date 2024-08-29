import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { IAttempt } from '@sh/types';

@ValidatorConstraint({ name: 'VideoBasedAttempt', async: false })
export class VideoBasedAttempt implements ValidatorConstraintInterface {
  validate(attempts: IAttempt[]) {
    return attempts.some((a) => a.result > 0) && !attempts.some((a) => a.result === 0);
  }

  defaultMessage() {
    return 'You cannot submit only DNF/DNS attempts, and you cannot submit empty attempts';
  }
}

@ValidatorConstraint({ name: 'NotAllDnsAndNotAllEmpty', async: false })
export class NotAllDnsAndNotAllEmpty implements ValidatorConstraintInterface {
  validate(attempts: IAttempt[]) {
    return attempts.some((a) => a.result !== -2) && attempts.some((a) => a.result !== 0);
  }

  defaultMessage() {
    return 'You cannot submit only DNS attempts or only empty attempts';
  }
}
