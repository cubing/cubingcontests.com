import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Min, NotEquals } from "class-validator";
import C from "@sh/constants";

export class EnterAttemptDto {
  @IsString()
  @IsNotEmpty()
  competitionWcaId: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsNumber()
  roundNumber: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  registrantId?: number;

  @IsOptional()
  @Matches(C.wcaIdRegexLoose, { message: "$value is not a valid WCA ID." })
  @IsString()
  wcaId?: string;

  @IsInt()
  @Min(1)
  attemptNumber: number;

  @IsInt()
  @NotEquals(0)
  attemptResult: number;
}
