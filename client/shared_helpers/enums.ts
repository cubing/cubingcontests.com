export enum EventFormat {
  Time = 'time',
  Number = 'number', // for FMC
  Multi = 'multi',
  TeamTime = 'teamtime', // e.g. for Team BLD or Team Factory
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

export enum CompetitionType {
  Meetup = 1,
  Competition = 2,
}

// The order is important here
export enum CompetitionState {
  Created = 10,
  Approved = 20,
  Ongoing = 30,
  Finished = 40,
  Published = 50,
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
  Red = 'f00',
  Blue = '00f',
  Green = '0f0',
  Yellow = 'ff0',
  White = 'fff',
  Cyan = '0ff',
  Magenta = 'f0f',
}
