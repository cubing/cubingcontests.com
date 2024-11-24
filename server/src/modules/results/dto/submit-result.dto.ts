import { Type } from "class-transformer";
import { AttemptDto, CreateResultDto } from "./create-result.dto";
import { ArrayMaxSize, ArrayMinSize, IsDateString, IsOptional, IsUrl, Validate, ValidateNested } from "class-validator";
import { IAttempt } from "@sh/types";
import { DATE_VALIDATION_MSG, DISCUSSION_LINK_VALIDATION_MSG, VIDEO_LINK_VALIDATION_MSG } from "~/src/helpers/messages";
import { SubmittedAttempts } from "~/src/helpers/customValidators";
import { IVideoBasedResultDto } from "~/shared_helpers/interfaces/Result";

export class SubmitResultDto extends CreateResultDto implements IVideoBasedResultDto {
  @IsDateString({}, { message: DATE_VALIDATION_MSG })
  date: Date;

  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @Validate(SubmittedAttempts)
  @ValidateNested({ each: true })
  @Type(() => AttemptDto)
  attempts: IAttempt[];

  @IsUrl({}, { message: VIDEO_LINK_VALIDATION_MSG })
  videoLink: string;

  @IsOptional()
  @IsUrl({}, { message: DISCUSSION_LINK_VALIDATION_MSG })
  discussionLink?: string;
}
