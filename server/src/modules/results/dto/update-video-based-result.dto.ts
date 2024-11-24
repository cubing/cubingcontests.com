import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsUrl,
} from "class-validator";
import { DATE_VALIDATION_MSG, DISCUSSION_LINK_VALIDATION_MSG, VIDEO_LINK_VALIDATION_MSG } from "~/src/helpers/messages";
import { IUpdateVideoBasedResultDto } from "~/shared_helpers/interfaces/Result";
import { UpdateResultDto } from "~/src/modules/results/dto/update-result.dto";

export class UpdateVideoBasedResultDto extends UpdateResultDto implements IUpdateVideoBasedResultDto {
  @IsDateString({}, { message: DATE_VALIDATION_MSG })
  date: Date;

  @IsOptional()
  @IsBoolean()
  unapproved?: true;

  @IsUrl({}, { message: VIDEO_LINK_VALIDATION_MSG })
  videoLink: string;

  @IsOptional()
  @IsUrl({}, { message: DISCUSSION_LINK_VALIDATION_MSG })
  discussionLink?: string;
}
