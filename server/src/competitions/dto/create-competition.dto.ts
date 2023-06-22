import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

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
  country: string;

  @IsDateString()
  startDate: Date;

  @IsDateString()
  endDate: Date;

  // ADD VALIDATION
  // events: IEvent[];

  @IsString()
  mainEventId: string;
}
