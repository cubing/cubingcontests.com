import { IProtoEvent } from '@sh/interfaces/proto/Event';

export interface IFrontendEvent extends IProtoEvent {
  ruleText?: string;
}
