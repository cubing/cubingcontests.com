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
  // First = 'd',
  // Second = 'e'
  // Final = 'c',
}

export enum WcaRecordType {
  WR = 'WR',
  ER = 'ER',
  NAR = 'NaR',
  SAR = 'SaR',
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
