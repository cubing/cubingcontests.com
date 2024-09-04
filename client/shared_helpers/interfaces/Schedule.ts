import { Color } from '../enums';

export interface ISchedule {
  competitionId: string;
  venues: IVenue[];
}

export interface IVenue {
  id: number;
  name: string;
  countryIso2: string;
  latitudeMicrodegrees: number;
  longitudeMicrodegrees: number;
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
