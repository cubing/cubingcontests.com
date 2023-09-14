import {
  ArrayMinSize,
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  Min,
  Max,
  MinLength,
  ValidateNested,
  IsEmail,
  ValidateIf,
  MaxLength,
  IsNotEmpty,
  ArrayMaxSize,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import Countries from '@sh/Countries';
import { Color, ContestType, RoundFormat, RoundProceed, RoundType } from '@sh/enums';
import {
  IPerson,
  ICompetitionDetails,
  ICompetitionEvent,
  ICompetition,
  IEvent,
  IRound,
  IProceed,
  IResult,
  ISchedule,
  IVenue,
  IRoom,
  IActivity,
} from '@sh/interfaces';
import { CreateEventDto } from '@m/events/dto/create-event.dto';
import { CreatePersonDto } from '@m/persons/dto/create-person.dto';
import { CreateResultDto } from '@m/results/dto/create-result.dto';
import { titleRegex, getTitleRegexOpts } from '~/src/helpers/regex';
import C from '@sh/constants';

const activityCodeRegex = /^[a-z0-9][a-z0-9-]{2,}$/;

export class CreateCompetitionDto implements ICompetition {
  @IsString()
  @MinLength(10)
  @MaxLength(45)
  @Matches(/^[A-Z][a-zA-Z0-9]*$/)
  competitionId: string;

  @IsString()
  @MinLength(10)
  @MaxLength(45)
  @Matches(titleRegex, getTitleRegexOpts('contest name'))
  name: string;

  @IsEnum(ContestType)
  type: ContestType;

  @ValidateIf((obj) => obj.type !== ContestType.Online)
  @IsString()
  city?: string;

  @IsIn(Countries.map((el) => el.code))
  countryIso2: string;

  @ValidateIf((obj) => obj.type !== ContestType.Online)
  @IsString()
  @MinLength(3)
  @Matches(titleRegex, getTitleRegexOpts('venue'))
  venue?: string;

  @ValidateIf((obj) => obj.type === ContestType.Competition || obj.address)
  @IsString()
  address?: string;

  @ValidateIf((obj) => obj.type !== ContestType.Online)
  @IsInt()
  @Min(-90000000)
  @Max(90000000)
  latitudeMicrodegrees?: number;

  @ValidateIf((obj) => obj.type !== ContestType.Online)
  @IsInt()
  @Min(-180000000)
  @Max(180000000)
  longitudeMicrodegrees?: number;

  @IsDateString()
  startDate: Date;

  @ValidateIf((obj) => obj.type === ContestType.Competition)
  @IsDateString()
  endDate?: Date;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePersonDto)
  organizers: IPerson[];

  @ValidateIf((obj) => obj.type === ContestType.Competition || obj.contact)
  @IsEmail()
  contact?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ValidateIf((obj) => obj.type === ContestType.Competition || obj.competitorLimit)
  @IsInt()
  @Min(4)
  competitorLimit?: number;

  @IsString()
  @MinLength(3)
  mainEventId: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CompetitionEventDto)
  events: ICompetitionEvent[];

  @ValidateIf((obj) => obj.type === ContestType.Competition)
  @ValidateNested()
  @Type(() => CompetitionDetailsDto)
  compDetails?: ICompetitionDetails;
}

////////////////////////////////////////////////////////////////////////////////////////////
// COMPETITION DETAILS
////////////////////////////////////////////////////////////////////////////////////////////

class CompetitionDetailsDto implements ICompetitionDetails {
  @ValidateNested()
  @Type(() => ScheduleDto)
  schedule: ISchedule;
}

class ScheduleDto implements ISchedule {
  @IsString()
  @IsNotEmpty()
  competitionId: string;

  @IsDateString()
  startDate: Date;

  @IsInt()
  @Min(1)
  numberOfDays: number;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VenueDto)
  venues: IVenue[];
}

class VenueDto implements IVenue {
  @IsInt()
  @Min(1)
  id: number;

  @IsString()
  @MinLength(3)
  @Matches(titleRegex, getTitleRegexOpts('venue names in the schedule'))
  name: string;

  @IsInt()
  @Min(-90000000)
  @Max(90000000)
  latitudeMicrodegrees: number;

  @IsInt()
  @Min(-180000000)
  @Max(180000000)
  longitudeMicrodegrees: number;

  @IsIn(Countries.map((el) => el.code))
  countryIso2: string;

  @IsString()
  @IsNotEmpty()
  timezone: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RoomDto)
  rooms: IRoom[];
}

class RoomDto implements IRoom {
  @IsInt()
  @Min(1)
  id: number;

  @IsString()
  @MinLength(3)
  @Matches(titleRegex, getTitleRegexOpts('room names in the schedule'))
  name: string;

  @IsEnum(Color)
  color: Color;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ActivityDto)
  activities: IActivity[];
}

class ActivityDto implements IActivity {
  @IsInt()
  @Min(1)
  id: number;

  @IsString()
  @Matches(activityCodeRegex)
  activityCode: string;

  @ValidateIf((obj) => obj.activityCode === 'other-misc')
  @IsString()
  @Matches(titleRegex, getTitleRegexOpts('custom activity names'))
  name?: string;

  @IsDateString()
  startTime: Date;

  @IsDateString()
  endTime: Date;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ActivityDto)
  childActivity?: IActivity[];
}

////////////////////////////////////////////////////////////////////////////////////////////
// COMPETITION EVENT
////////////////////////////////////////////////////////////////////////////////////////////

class CompetitionEventDto implements ICompetitionEvent {
  @ValidateNested()
  @Type(() => CreateEventDto)
  event: IEvent;

  @ArrayMinSize(1)
  @ArrayMaxSize(C.maxRounds)
  @ValidateNested({ each: true })
  @Type(() => RoundDto)
  rounds: IRound[];
}

class RoundDto implements IRound {
  @IsString()
  @Matches(activityCodeRegex)
  roundId: string;

  @IsString()
  @IsNotEmpty()
  competitionId: string;

  @IsDateString()
  date: Date;

  @IsEnum(RoundType)
  roundTypeId: RoundType;

  @IsEnum(RoundFormat)
  format: RoundFormat;

  @ValidateIf((obj) => obj.roundTypeId !== RoundType.Final)
  @ValidateNested()
  @Type(() => ProceedDto)
  proceed?: IProceed;

  @ValidateNested({ each: true })
  @Type(() => CreateResultDto)
  results: IResult[];
}

class ProceedDto implements IProceed {
  @IsEnum(RoundProceed)
  type: RoundProceed;

  @IsInt()
  @Min(2)
  value: number;
}
