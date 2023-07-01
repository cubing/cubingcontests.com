import { IsDateString, IsIn, IsString, Matches, MinLength } from 'class-validator';
import Countries from '@sh/Countries';

export class CreateCompetitionDto {
  @IsString()
  @Matches(/^[A-Z][a-zA-Z0-9]{9,}$/)
  competitionId: string;

  @IsString()
  @Matches(/^[A-Z0-9][a-zA-Z0-9 -:']{9,}$/)
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
