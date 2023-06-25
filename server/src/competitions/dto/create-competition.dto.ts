import { IsDateString, IsEnum, IsIn, IsNumber, IsOptional, IsString, Matches, Min, MinLength } from 'class-validator';
import { ICompetitionBase } from '@sh/interfaces/Competition';
import Countries from '@sh/Countries';

// The events field is the only difference from the ICompetition interface
export class CreateCompetitionDto implements ICompetitionBase {
  @IsString()
  @Matches(/^[A-Z][a-zA-Z0-9]{9,}$/)
  competitionId: string;

  @IsString()
  @Matches(/^[A-Z][a-zA-Z0-9 ]{9,}$/)
  name: string;

  @IsString()
  @Matches(/^[A-Z][a-zA-Z -]+$/)
  city: string;

  @IsIn(Countries.map((el) => el.code))
  countryId: string;

  @IsDateString()
  startDate: Date;

  @IsDateString()
  endDate: Date;

  @IsString()
  @MinLength(3)
  mainEventId: string;
}
