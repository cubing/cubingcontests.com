import {
  ArrayMaxSize,
  ArrayMinSize,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  Validate,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { IAttempt } from "@sh/types";
import C from "@sh/constants";
import { ContestAttempts } from "~/src/helpers/customValidators";
import { IResultDto } from "~/shared_helpers/interfaces/Result";

export class CreateResultDto implements IResultDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

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

export class AttemptDto implements IAttempt {
  @IsInt()
  result: number;

  @ValidateIf((_, value) => value !== undefined) // this is different from @IsOptional(), because that also allows null
  @IsInt()
  @Min(1)
  @Max(C.maxTime - 1)
  memo?: number;
}
