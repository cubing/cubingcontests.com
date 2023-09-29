import { ArrayMinSize, IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min, MinLength } from 'class-validator';
import { IEvent } from '@sh/interfaces';
import { EventFormat, EventGroup, RoundFormat } from '@sh/enums';
import { getTitleRegexOpts, titleRegex } from '~/src/helpers/regex';

export class CreateEventDto implements IEvent {
  @IsString()
  @MinLength(3)
  @Matches(/^[a-z0-9_]*$/)
  eventId: string;

  @IsString()
  @MinLength(3)
  @Matches(titleRegex, getTitleRegexOpts('event name'))
  name: string;

  @IsInt()
  @Min(1)
  rank: number;

  @IsEnum(EventFormat)
  format: EventFormat;

  @IsEnum(RoundFormat)
  defaultRoundFormat: RoundFormat;

  @ArrayMinSize(1)
  @IsEnum(EventGroup, { each: true })
  groups: EventGroup[];

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(20)
  participants?: number;
}
