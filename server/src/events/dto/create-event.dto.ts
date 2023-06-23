import { IsNumber, IsString, Min, MinLength } from 'class-validator';
import IEvent from '@sh/interfaces/IEvent';
import { EventFormat } from '@sh/enums';

export class CreateEventDto implements IEvent {
  @IsString()
  eventId: string;

  @IsString()
  @MinLength(3)
  name: string;

  @IsNumber()
  @Min(0)
  rank: number;

  // ADD VALIDATION
  formatId: EventFormat;
}
