import { IsDateString, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { ICompetitionBase } from '@sh/interfaces/Competition';
// import IRound from '@sh/interfaces/Round';

// The events field is the only difference from the ICompetition interface
export class CreateCompetitionDto implements ICompetitionBase {
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

  @IsString()
  mainEventId: string;
}
