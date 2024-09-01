import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { IAttempt } from '@sh/types';

@ValidatorConstraint({ name: 'VideoBasedAttempts', async: false })
export class VideoBasedAttempts implements ValidatorConstraintInterface {
  validate(attempts: IAttempt[]) {
    return attempts.some((a) => a.result > 0) && !attempts.some((a) => a.result === 0);
  }

  defaultMessage() {
    return 'You cannot submit only DNF/DNS attempts, and you cannot submit empty attempts';
  }
}

@ValidatorConstraint({ name: 'ContestAttempts', async: false })
export class ContestAttempts implements ValidatorConstraintInterface {
  validate(attempts: IAttempt[]) {
    return attempts.some((a) => a.result !== -2) && attempts.some((a) => a.result !== 0);
  }

  defaultMessage() {
    return 'You cannot submit only DNS attempts or only empty attempts';
  }
}
