export type Schedule = {
  competitionId: string;
  venues: Venue[];
};

export type Venue = {
  id: number;
  name: string;
  countryIso2: string;
  latitudeMicrodegrees: number;
  longitudeMicrodegrees: number;
  timezone: string;
  rooms: Room[];
};

export type Room = {
  id: number;
  name: string;
  color: string;
  activities: Activity[];
};

export type Activity = {
  id: number;
  name?: string; // only set when activityCode = other-misc
  activityCode: string;
  startTime: Date;
  endTime: Date;
  childActivities: Activity[];
};
