import { IEventRule } from '@sh/interfaces';
import { IProtoEvent } from '@sh/interfaces/proto/Event';

export interface IEvent extends IProtoEvent {
  rule?: IEventRule;
}
