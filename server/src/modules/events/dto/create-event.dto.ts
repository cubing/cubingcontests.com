import { Equals, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Matches, Min, MinLength } from 'class-validator';
import { IEvent } from '@sh/interfaces';
import { EventFormat, RoundFormat } from '@sh/enums';
import { titleRegex } from '~/src/helpers/regex';

export class CreateEventDto implements IEvent {
  @IsString()
  @MinLength(3)
  @Matches(/^[a-z0-9]*$/)
  eventId: string;

  @IsString()
  @MinLength(3)
  @Matches(titleRegex)
  name: string;

  @IsNumber()
  @Min(0)
  rank: number;

  @IsEnum(EventFormat)
  format: EventFormat;

  @IsEnum(RoundFormat)
  defaultRoundFormat: RoundFormat;

  @IsOptional()
  @Equals(true)
  meetupOnly?: boolean;

  @IsOptional()
  @Equals(true)
  removed?: boolean;
}
