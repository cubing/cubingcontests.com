import { IsEnum, IsNumber, IsString, Min, MinLength } from 'class-validator';
import IEvent from '@sh/interfaces/Event';
import { EventFormat, RoundFormat } from '@sh/enums';

export class CreateEventDto implements IEvent {
  @IsString()
  @MinLength(3)
  eventId: string;

  @IsString()
  @MinLength(3)
  name: string;

  @IsNumber()
  @Min(0)
  rank: number;

  @IsEnum(EventFormat)
  format: EventFormat;

  @IsEnum(RoundFormat)
  defaultRoundFormat: RoundFormat;
}
