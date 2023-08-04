import {
  ArrayMinSize,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { IResult } from '@sh/interfaces';

export class CreateResultDto implements IResult {
  @IsString()
  @IsNotEmpty()
  competitionId: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsDateString()
  date: Date;

  @IsOptional()
  @IsBoolean()
  compNotPublished: boolean;

  @IsString()
  @Matches(/^[1-9][0-9;]*$/)
  personId: string;

  @IsNumber()
  @Min(1)
  ranking: number;

  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  attempts: number[];

  @IsNumber()
  best: number;

  @IsNumber()
  average: number;

  @IsOptional()
  @IsString()
  regionalSingleRecord?: string;

  @IsOptional()
  @IsString()
  regionalAverageRecord?: string;
}
