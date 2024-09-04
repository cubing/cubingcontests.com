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
  IsNotEmpty,
  ArrayMaxSize,
  IsInt,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
  MaxLength,
  NotEquals,
} from 'class-validator';
import { Type } from 'class-transformer';
import Countries from '@sh/Countries';
import { Color, ContestType, EventFormat, RoundFormat, RoundProceed, RoundType } from '@sh/enums';
import {
  IPerson,
  ICompetitionDetails,
  IContestEvent,
  IContestDto,
  IEvent,
  IRound,
  IProceed,
  IResult,
  ISchedule,
  IVenue,
  IRoom,
  IActivity,
  IMeetupDetails,
  ITimeLimit,
  ICutoff,
} from '@sh/types';
import { CreateEventDto } from '@m/events/dto/create-event.dto';
import { PersonDto } from '@m/persons/dto/person.dto';
import { CreateResultDto } from '@m/results/dto/create-result.dto';
import { getMaxLengthOpts, getMinLengthOpts, invalidCountryOpts } from '~/src/helpers/validation';
import C from '@sh/constants';
import { getFormattedTime, getIsCompType } from '@sh/sharedFunctions';

const activityCodeRegex = /^[a-z0-9][a-z0-9-_]{2,}$/;

@ValidatorConstraint({ name: 'EventWithTimeFormatHasTimeLimits', async: false })
class EventWithTimeFormatHasTimeLimits implements ValidatorConstraintInterface {
  validate(events: IContestEvent[]) {
    return !events.some((ce) => ce.event.format === EventFormat.Time && ce.rounds.some((r) => !r.timeLimit));
  }

  defaultMessage() {
    return 'An event with the format Time must have a time limit';
  }
}

@ValidatorConstraint({ name: 'EventWithoutTimeFormatHasNoLimitsOrCutoffs', async: false })
class EventWithoutTimeFormatHasNoLimitsOrCutoffs implements ValidatorConstraintInterface {
  validate(events: IContestEvent[]) {
    return !events.some((ce) => ce.event.format !== EventFormat.Time && ce.rounds.some((r) => r.timeLimit || r.cutoff));
  }

  defaultMessage() {
    return 'An event with a format other than Time cannot have a time limit or cutoff';
  }
}

export class ContestDto implements IContestDto {
  @IsString()
  @MinLength(5, getMinLengthOpts('contest ID', 5))
  @Matches(/^[a-zA-Z0-9]*$/, { message: 'The contest ID must only contain alphanumeric characters' })
  competitionId: string;

  @IsString()
  @MinLength(10, getMinLengthOpts('contest name', 10))
  @Matches(/.* [0-9]{4}$/, { message: 'The contest name must have the year at the end, separated by a space' })
  name: string;

  @IsString()
  @MinLength(8, getMinLengthOpts('short name', 8))
  @MaxLength(32, getMaxLengthOpts('short name', 32))
  @Matches(/.* [0-9]{4}$/, { message: 'The short name must have the year at the end, separated by a space' })
  shortName: string;

  @IsEnum(ContestType)
  type: ContestType;

  @IsString()
  @IsNotEmpty({ message: 'Please enter the city' })
  city: string;

  @IsIn(Countries.map((el) => el.code), invalidCountryOpts)
  countryIso2: string;

  @IsString()
  venue: string;

  @IsString()
  address: string;

  @IsInt({ message: 'Please enter a valid latitude' })
  @Min(-90000000, { message: 'The latitude cannot be less than -90 degrees' })
  @Max(90000000, { message: 'The latitude cannot be more than 90 degrees' })
  @NotEquals(0, { message: 'Please enter the venue latitude' })
  latitudeMicrodegrees: number;

  @IsInt({ message: 'Please enter a valid longitude' })
  @Min(-180000000, { message: 'The longitude cannot be less than -180 degrees' })
  @Max(180000000, { message: 'The longitude cannot be more than 180 degrees' })
  @NotEquals(0, { message: 'Please enter the venue longitude' })
  longitudeMicrodegrees: number;

  @IsDateString({}, { message: 'Please enter a valid start date' })
  startDate: Date;

  @ValidateIf((obj) => getIsCompType(obj.type))
  @IsDateString({}, { message: 'Please enter a valid end date' })
  endDate?: Date;

  @ArrayMinSize(1, { message: 'Please enter at least one organizer' })
  @ValidateNested({ each: true })
  @Type(() => PersonDto)
  organizers: IPerson[];

  @IsOptional()
  @IsEmail()
  contact?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ValidateIf((obj) => getIsCompType(obj.type) || obj.competitorLimit)
  @IsInt({ message: 'Please enter a valid competitor limit' })
  @Min(C.minCompetitorLimit, { message: `The competitor limit cannot be less than ${C.minCompetitorLimit}` })
  competitorLimit?: number;

  @ArrayMinSize(1, { message: 'Please select at least one event' })
  @Validate(EventWithTimeFormatHasTimeLimits)
  @Validate(EventWithoutTimeFormatHasNoLimitsOrCutoffs)
  @ValidateNested({ each: true })
  @Type(() => ContestEventDto)
  events: IContestEvent[];

  @ValidateIf((obj) => getIsCompType(obj.type))
  @ValidateNested()
  @Type(() => CompetitionDetailsDto)
  compDetails?: ICompetitionDetails;

  @ValidateIf((obj) => !getIsCompType(obj.type))
  @ValidateNested()
  @Type(() => MeetupDetailsDto)
  meetupDetails?: IMeetupDetails;
}

////////////////////////////////////////////////////////////////////////////////////////////
// COMPETITION DETAILS
////////////////////////////////////////////////////////////////////////////////////////////

class CompetitionDetailsDto implements ICompetitionDetails {
  @ValidateNested()
  @Type(() => ScheduleDto)
  schedule: ISchedule;
}

class MeetupDetailsDto implements IMeetupDetails {
  @IsDateString({}, { message: 'Please enter a valid start time' })
  startTime: Date;
}

class ScheduleDto implements ISchedule {
  @IsString()
  @IsNotEmpty()
  competitionId: string;

  @ArrayMinSize(1, { message: 'Please enter at least one venue' })
  @ValidateNested({ each: true })
  @Type(() => VenueDto)
  venues: IVenue[];
}

class VenueDto implements IVenue {
  @IsInt()
  @Min(1)
  id: number;

  // This is required, even though the venue name above is not (this is intentional)
  @IsString()
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

  @ValidateNested({ each: true })
  @Type(() => RoomDto)
  rooms: IRoom[];
}

class RoomDto implements IRoom {
  @IsInt()
  @Min(1)
  id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Color)
  color: Color;

  @ArrayMinSize(1, { message: 'Please enter at least one activity' })
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
  @IsNotEmpty()
  name?: string;

  @IsDateString({}, { message: 'Please enter valid activity start times' })
  startTime: Date;

  @IsDateString({}, { message: 'Please enter valid activity end times' })
  endTime: Date;

  @ValidateNested({ each: true })
  @Type(() => ActivityDto)
  childActivities: IActivity[];
}

////////////////////////////////////////////////////////////////////////////////////////////
// COMPETITION EVENT
////////////////////////////////////////////////////////////////////////////////////////////

@ValidatorConstraint({ name: 'HasValidTimeLimitAndCutoff', async: false })
class HasValidTimeLimitAndCutoff implements ValidatorConstraintInterface {
  validate(rounds: IRound[]) {
    return !rounds.some((r) => r.timeLimit && r.cutoff && r.cutoff.attemptResult >= r.timeLimit.centiseconds);
  }

  defaultMessage() {
    return 'The cutoff cannot be higher than or equal to the time limit';
  }
}

class ContestEventDto implements IContestEvent {
  @ValidateNested()
  @Type(() => CreateEventDto)
  event: IEvent;

  @ArrayMinSize(1, { message: 'Please enter at least one round for each event' })
  @ArrayMaxSize(C.maxRounds, { message: `You cannot hold more than ${C.maxRounds} rounds for one event` })
  @Validate(HasValidTimeLimitAndCutoff)
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

  @IsEnum(RoundType)
  roundTypeId: RoundType;

  @IsEnum(RoundFormat)
  format: RoundFormat;

  // Actually required for events with the format Time. This is validated inside of ContestDto.
  @IsOptional()
  @ValidateNested()
  @Type(() => TimeLimitDto)
  timeLimit?: ITimeLimit;

  // Only allowed for events with the format Time. This is also validated inside of ContestDto.
  @IsOptional()
  @ValidateNested()
  @Type(() => CutoffDto)
  cutoff?: ICutoff;

  @ValidateIf((obj) => obj.roundTypeId !== RoundType.Final)
  @ValidateNested()
  @Type(() => ProceedDto)
  proceed?: IProceed;

  @ValidateNested({ each: true })
  @Type(() => CreateResultDto)
  results: IResult[];
}

class TimeLimitDto implements ITimeLimit {
  @IsInt()
  @Min(1, { message: 'Please enter a valid time limit' })
  @Max(C.maxTimeLimit, {
    message: `The time limit cannot be higher than ${getFormattedTime(C.maxTimeLimit)}`,
  })
  centiseconds: number;

  @IsString({ each: true })
  @Matches(activityCodeRegex, { each: true })
  cumulativeRoundIds: string[];
}

class CutoffDto implements ICutoff {
  @IsInt()
  @Min(1, { message: 'Please enter a valid cutoff' })
  @Max(C.maxTimeLimit, { message: 'Please enter a valid cutoff' })
  attemptResult: number;

  @IsInt()
  @Min(1)
  @Max(2)
  numberOfAttempts: number;
}

class ProceedDto implements IProceed {
  @IsEnum(RoundProceed)
  type: RoundProceed;

  @IsInt({ message: 'Please enter a valid round proceed value' })
  @Min(1, { message: 'The round proceed value must be at least 1' })
  @ValidateIf((obj) => obj.type === RoundProceed.Percentage)
  @Max(75, { message: 'The round proceed percentage must be at most 75%' })
  value: number;
}
