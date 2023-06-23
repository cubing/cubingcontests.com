export enum EventFormat {
  Time = 'time',
  Number = 'number', // for FMC
  Multi = 'multi',
  TeamTime = 'teamtime', // e.g. for Team BLD
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
