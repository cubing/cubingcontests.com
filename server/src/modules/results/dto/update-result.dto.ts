import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsInt, Validate, ValidateNested } from "class-validator";
import { AttemptDto } from "./create-result.dto";
import { IAttempt, IUpdateResultDto } from "@sh/types";
import { ContestAttempts } from "~/src/helpers/customValidators";

export class UpdateResultDto implements IUpdateResultDto {
  @ArrayMinSize(1)
  @IsInt({ each: true })
  personIds: number[];

  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @Validate(ContestAttempts)
  @ValidateNested({ each: true })
  @Type(() => AttemptDto)
  attempts: IAttempt[];
}
