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

export enum Color {
  White = "fff",
  Black = "000",
  Red = "f00",
  Yellow = "ff0",
  Green = "0f0",
  Cyan = "0ff",
  Blue = "00f",
  Magenta = "f0f",
}
