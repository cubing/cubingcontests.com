import ICompetition from './interfaces/Competition';
import IPerson from './interfaces/Person';

export interface ICompetitionInfo {
  id: string;
  name: string;
  date: Date;
  : string;
  participants: number;
  events: number;
}

export interface IWCIFCompetition extends ICompetition {
  persons: IPerson[];
}
