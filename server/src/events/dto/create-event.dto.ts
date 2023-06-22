import { IsArray, IsNumber, IsString, Min, MinLength } from 'class-validator';
import { EventFormat, RoundFormat, CutoffFormat } from '@sh/enums';

export class CreateEventDto {
  // ADD VALIDATION
  @IsString()
  eventId: string;

  @IsString()
  @MinLength(3)
  name: string;

  @IsNumber()
  @Min(0)
  rank: number;

  // ADD VALIDATION
  @IsString()
  format: EventFormat;

  // ADD VALIDATION
  @IsArray()
  allowedRoundFormats: RoundFormat[];

  // ADD VALIDATION
  @IsArray()
  allowedCutoffFormats: CutoffFormat[];
}
