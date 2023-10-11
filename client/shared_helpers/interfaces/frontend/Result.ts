import { IEvent, IPerson, IResult } from '@sh/interfaces';

export interface IFrontendResult extends IResult {
  event: IEvent;
  persons: IPerson[];
}
