import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import {
  IAttempt,
  IContest,
  IContestEvent,
  IProceed,
  IRound,
} from "~/helpers/types";
import { ContestType, EventFormat, RoundProceed } from "~/helpers/enums";
import { C } from "~/helpers/constants";

@ValidatorConstraint({ name: "EventWithTimeFormatHasTimeLimits", async: false })
export class EventWithTimeFormatHasTimeLimits
  implements ValidatorConstraintInterface {
  validate(events: IContestEvent[]) {
    return !events.some((ce) =>
      ce.event.format === EventFormat.Time &&
      ce.rounds.some((r) => !r.timeLimit)
    );
  }

  defaultMessage() {
    return "An event with the format Time must have a time limit";
  }
}

@ValidatorConstraint({
  name: "EventWithoutTimeFormatHasNoLimitsOrCutoffs",
  async: false,
})
export class EventWithoutTimeFormatHasNoLimitsOrCutoffs
  implements ValidatorConstraintInterface {
  validate(events: IContestEvent[]) {
    return !events.some((ce) =>
      ce.event.format !== EventFormat.Time &&
      ce.rounds.some((r) => r.timeLimit || r.cutoff)
    );
  }

  defaultMessage() {
    return "An event with a format other than Time cannot have a time limit or cutoff";
  }
}

@ValidatorConstraint({ name: "RoundHasValidTimeLimitAndCutoff", async: false })
export class RoundHasValidTimeLimitAndCutoff
  implements ValidatorConstraintInterface {
  validate(rounds: IRound[]) {
    return !rounds.some((r) =>
      r.timeLimit && r.cutoff &&
      r.cutoff.attemptResult >= r.timeLimit.centiseconds
    );
  }

  defaultMessage() {
    return "The cutoff cannot be higher than or equal to the time limit";
  }
}

@ValidatorConstraint({ name: "ProceedValueMinMax", async: false })
export class ProceedValueMinMax implements ValidatorConstraintInterface {
  validate(proceed: IProceed) {
    return (
      (proceed.type === RoundProceed.Number &&
        proceed.value >= C.minProceedNumber) ||
      (proceed.type === RoundProceed.Percentage &&
        proceed.value <= C.maxProceedPercentage)
    );
  }

  defaultMessage() {
    return `A round cannot allow fewer than ${C.minProceedNumber} competitors or more than ${C.maxProceedPercentage}% of competitors to proceed to the next round`;
  }
}

@ValidatorConstraint({ name: "SubmittedAttempts", async: false })
export class SubmittedAttempts implements ValidatorConstraintInterface {
  validate(attempts: IAttempt[]) {
    return attempts.some((a) => a.result > 0) &&
      !attempts.some((a) => a.result === 0);
  }

  defaultMessage() {
    return "You cannot submit only DNF/DNS attempts, and you cannot submit empty attempts";
  }
}

@ValidatorConstraint({ name: "ContestAttempts", async: false })
export class ContestAttempts implements ValidatorConstraintInterface {
  validate(attempts: IAttempt[]) {
    return attempts.some((a) => a.result !== -2) &&
      attempts.some((a) => a.result !== 0);
  }

  defaultMessage() {
    return "You cannot submit only DNS attempts or only empty attempts";
  }
}

@ValidatorConstraint({ name: "LegalContestName", async: false })
export class LegalContestName implements ValidatorConstraintInterface {
  validate(name: string, args: ValidationArguments) {
    const type = (args.object as IContest).type;

    return (type === ContestType.WcaComp ||
      (!/championship/i.test(name) && !/national/i.test(name))) &&
      (type !== ContestType.Meetup || !/open/i.test(name));
  }

  defaultMessage(args: ValidationArguments) {
    if (/open/i.test(args.value)) {
      return `The ${args.property} must not contain "open" (only applies to meetups)`;
    }

    return `The ${args.property} must not contain "championship" or "national"`;
  }
}
