import IDate from './interfaces/Date';

export type EventID =
  | '333'
  | '222'
  | '444'
  | '555'
  | '666'
  | '777'
  | '333bf'
  | '333fm'
  | '333oh'
  | 'clock'
  | 'minx'
  | 'pyram'
  | 'skewb'
  | 'sq1'
  | '444bf'
  | '555bf'
  | '333mbf'
  | '333tbf';

export type FormatID = 'a' | 'm' | '3' | '2' | '1';

export interface IWCIFCompetition {
  id: string;
  name: string;
  location: string;
  date: IDate;
  events: IWCIFEvent[];
  persons: IWCIFPerson[];
}

export interface IWCIFEvent {
  id: EventID;
  rounds: IWCIFRound[];
}

interface IWCIFRound {
  id: string;
  format: FormatID;
  results: IWCIFResult[];
}

export interface IWCIFResult {
  personId: string;
  ranking: number;
  attempts: {
    // Number of centiseconds; 0 is a skipped attempt (e.g. when cut-off was not met) -1 is DNF, -2 is DNS.
    // For FMC it's the number of moves.
    result: number;
  }[];
  best: number;
  average: number; // for FMC it's 100 times the mean (to avoid decimals)
}

interface IWCIFPerson {
  registrantId: string;
  name: string;
}

export interface IEventInfo {
  id: EventID;
  name: string;
  rank: number;
}

export interface IContestInfo {
  id: string;
  name: string;
  date: IDate;
  location: string;
  participants: number;
  events: number;
}
