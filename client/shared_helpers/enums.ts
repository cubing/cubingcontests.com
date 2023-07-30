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
  Semi = '3',
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
  Red = 'red',
  Blue = 'blue',
  Green = 'green',
  Yellow = 'yellow',
  White = 'white',
  Cyan = 'cyan',
  Magenta = 'magenta',
}
