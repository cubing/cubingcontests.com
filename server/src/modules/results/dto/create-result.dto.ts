import {
  ArrayMinSize,
  ArrayMaxSize,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
  Max,
} from 'class-validator';
import { IAttempt, IResult } from '@sh/interfaces';
import { Type } from 'class-transformer';

export class CreateResultDto implements IResult {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  competitionId?: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsDateString()
  date: Date;

  @IsOptional()
  @IsBoolean()
  compNotPublished: boolean;

  @ArrayMinSize(1)
  @IsInt({ each: true })
  personIds: number[];

  @IsOptional()
  @IsInt()
  ranking?: number;

  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => AttemptDto)
  attempts: IAttempt[];

  @IsInt()
  best: number;

  @IsInt()
  average: number;

  @IsOptional()
  @IsString()
  regionalSingleRecord?: string;

  @IsOptional()
  @IsString()
  regionalAverageRecord?: string;

  @IsOptional()
  @IsUrl()
  videoLink?: string;

  @IsOptional()
  @IsUrl()
  discussionLink?: string;
}

class AttemptDto implements IAttempt {
  @IsInt()
  result: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8639999) // one centisecond under 24 hours
  memo?: number;
}
