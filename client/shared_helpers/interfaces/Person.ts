import { IProtoPerson } from '@sh/interfaces/proto/Person';

export interface IPerson extends IProtoPerson {
  personId: number; // integer number that is counted from 1 up
  createdBy: unknown; // user ID of the user who created the person
}
