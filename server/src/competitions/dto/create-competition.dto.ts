import { IsDateString, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import IRound from '@sh/interfaces/IRound';

export class CreateCompetitionDto {
  @IsString()
  @MinLength(10)
  competitionId: string;

  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(2)
  city: string;

  @IsString()
  @MinLength(2)
  countryId: string;

  @IsDateString()
  startDate: Date;

  @IsDateString()
  endDate: Date;

  // ADD VALIDATION(?)
  events: {
    eventId: string;
    rounds: IRound[];
  }[];

  @IsString()
  mainEventId: string;
}
