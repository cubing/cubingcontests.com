import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import Countries from '@sh/Countries';
import { CompetitionType } from '@sh/enums';
import { IPerson, IRound } from '@sh/interfaces';

export class CreateCompetitionDto {
  @IsString()
  @Matches(/^[A-Z][a-zA-Z0-9]{9,}$/)
  competitionId: string;

  @IsString()
  @Matches(/^[A-Z0-9][a-zA-Z0-9 -:']{9,}$/)
  name: string;

  @IsEnum(CompetitionType)
  type: CompetitionType;

  @IsString()
  @Matches(/^[A-Z][a-zA-Z -']+$/)
  city: string;

  @IsIn(Countries.map((el) => el.code))
  countryId: string;

  @IsString()
  @Matches(/^[A-Z][a-zA-Z -:']+$/)
  venue: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsDateString()
  startDate: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsArray()
  organizers?: IPerson[];

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(5)
  competitorLimit: number;

  @IsString()
  @MinLength(3)
  mainEventId: string;

  @IsArray()
  @ArrayMinSize(1)
  events: {
    eventId: string;
    rounds: IRound[];
  }[];
}
