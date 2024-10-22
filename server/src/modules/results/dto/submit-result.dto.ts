import { Type } from "class-transformer";
import { AttemptDto, CreateResultDto } from "./create-result.dto";
import { ArrayMaxSize, ArrayMinSize, IsBoolean, IsOptional, IsUrl, Validate, ValidateNested } from "class-validator";
import { IAttempt, IResult } from "@sh/types";
import { DISCUSSION_LINK_VALIDATION_MSG, VIDEO_LINK_VALIDATION_MSG } from "~/src/helpers/messages";
import { VideoBasedAttempts } from "~/src/helpers/customValidators";

export class SubmitResultDto extends CreateResultDto implements IResult {
  @IsOptional()
  @IsBoolean()
  unapproved?: true;

  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @Validate(VideoBasedAttempts)
  @ValidateNested({ each: true })
  @Type(() => AttemptDto)
  attempts: IAttempt[];

  @IsUrl({}, { message: VIDEO_LINK_VALIDATION_MSG })
  videoLink: string;

  @IsOptional()
  @IsUrl({}, { message: DISCUSSION_LINK_VALIDATION_MSG })
  discussionLink?: string;
}
