import {
  ArrayMaxSize,
  ArrayMinSize,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  Validate,
  ValidateNested,
} from "class-validator";
import { AttemptDto } from "../modules/results/dto/create-result.dto";
import { Type } from "class-transformer";
import { IAttempt } from "~/shared/types";
import { C } from "~/shared/constants";
import { ContestAttempts } from "~/src/helpers/customValidators";

export class EnterResultsDto {
  @IsString()
  @IsNotEmpty()
  competitionWcaId: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsNumber()
  roundNumber: number;

  @ValidateNested({ each: true })
  @Type(() => ExternalResultDto)
  results: ExternalResultDto[];
}

export class ExternalResultDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  registrantId?: number;

  @IsOptional()
  @Matches(C.wcaIdRegexLoose, { message: "$value is not a valid WCA ID." })
  @IsString()
  wcaId?: string;

  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @Validate(ContestAttempts)
  @ValidateNested({ each: true })
  @Type(() => AttemptDto)
  attempts: IAttempt[];
}
