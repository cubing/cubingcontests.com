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
import { IAttempt } from "~/helpers/types";
import { C } from "~/helpers/constants";
import { ContestAttempts } from "~/src/helpers/customValidators";
import { ICreateResultDto } from "~/helpers/interfaces/Result";

export class CreateResultDto implements ICreateResultDto {
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
