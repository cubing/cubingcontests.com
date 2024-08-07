import { Type } from 'class-transformer';
import { AttemptDto, CreateResultDto } from './create-result.dto';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsOptional,
  IsUrl,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { IAttempt, IResult } from '@sh/types';
import { DISCUSSION_LINK_VALIDATION_MSG, VIDEO_LINK_VALIDATION_MSG } from '~/src/helpers/messages';

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

  @IsUrl({}, { message: VIDEO_LINK_VALIDATION_MSG })
  videoLink: string;

  @IsOptional()
  @IsUrl({}, { message: DISCUSSION_LINK_VALIDATION_MSG })
  discussionLink?: string;
}
