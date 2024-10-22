import { ArrayMinSize, IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min, MinLength } from "class-validator";
import { IFeEvent } from "@sh/types";
import { EventFormat, EventGroup, RoundFormat } from "@sh/enums";
import { getMinLengthOpts } from "~/src/helpers/validation";

export class CreateEventDto implements IFeEvent {
  @IsString()
  @MinLength(3, getMinLengthOpts("event ID", 3))
  @Matches(/^[a-z0-9_]*$/)
  eventId: string;

  @IsString()
  @MinLength(3, getMinLengthOpts("event name", 3))
  name: string;

  @IsInt()
  @Min(1, { message: "The rank cannot be less than 1" })
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
  @Min(2, { message: "The number of participants cannot be less than 2" })
  @Max(20, { message: "The number of participants cannot be more than 20" })
  participants?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  ruleText?: string;
}
