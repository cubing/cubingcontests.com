import { Color } from '../enums';

export interface ISchedule {
  competitionId: string;
  startDate: Date;
  numberOfDays: number;
  venues: IVenue[];
}

export interface IVenue {
  id: number;
  name: string;
  latitudeMicrodegrees: number;
  longitudeMicrodegrees: number;
  countryIso2: string;
  timezone: string;
  rooms: IRoom[];
}

export interface IRoom {
  id: number;
  name: string;
  color: Color;
  activities: IActivity[];
}

export interface IActivity {
  id: number;
  name?: string; // only set when activityCode = other-misc
  activityCode: string;
  startTime: Date;
  endTime: Date;
  childActivities: IActivity[];
}
