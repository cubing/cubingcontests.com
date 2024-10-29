export enum EventFormat {
  Time = 'time',
  Number = 'number', // for FMC
  Multi = 'multi',
}

export enum EventGroup {
  // The first five are used for grouping events on the rankings pages. An event MUST include ONE of these main groups.
  WCA = 1, // event ranks are the same as on the WCA
  Unofficial = 2, // event ranks start from 1000
  ExtremeBLD = 3, // ...from 2000
  Miscellaneous = 11, // ...from 3000
  Removed = 4, // ...from 4000

  // MeetupOnly = 5,
  SubmissionsAllowed = 6,
  // Team = 7,
  RemovedWCA = 8, // e.g. magic, mmagic, 333ft, 333mbo
  Hidden = 9,
  HasMemo = 10, // e.g. 3x3-5x5 Blindfolded, Multi-Blind, etc., but NOT Team-Blind
}

export enum RoundFormat {
  Average = 'a',
  Mean = 'm',
  BestOf3 = '3',
  BestOf2 = '2',
  BestOf1 = '1',
}

export enum RoundType {
  First = '1',
  Second = '2',
  Third = '3',
  Fourth = '4',
  Fifth = '5',
  Sixth = '6',
  Seventh = '7',
  Eighth = '8',
  Semi = 's',
  Final = 'f',
}

export enum RoundProceed {
  Percentage = 1,
  Number = 2,
}

export enum ContestType {
  Meetup = 1,
  WcaComp = 2,
  // Online = 3, // this contest type has been removed
  Competition = 4,
}

// The order is important here
export enum ContestState {
  Created = 10,
  Approved = 20,
  Ongoing = 30,
  Finished = 40,
  Published = 50,
  Removed = 100,
}

export enum WcaRecordType {
  WR = 'WR',
  ER = 'ER',
  NAR = 'NAR',
  SAR = 'SAR',
  AsR = 'AsR',
  AfR = 'AfR',
  OcR = 'OcR',
  NR = 'NR',
  PR = 'PR',
}

export enum Color {
  White = 'fff',
  Black = '000',
  Red = 'f00',
  Yellow = 'ff0',
  Green = '0f0',
  Cyan = '0ff',
  Blue = '00f',
  Magenta = 'f0f',
}

export enum Role {
  User = 'user',
  Admin = 'admin',
  Moderator = 'mod',
}
