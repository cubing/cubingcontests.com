import { EventDocument } from '~/src/models/event.model';
import { eventsStub } from '../stubs/events.stub';

export const mockEventModel = (): any => ({
  tempOutput: undefined,
  find(query: any): EventDocument[] {
    this.tempOutput = eventsStub();

    if (query?.eventId) {
      if (typeof query.eventId === 'object') {
        this.tempOutput = this.tempOutput.filter((el: EventDocument) => query.eventId.$in.includes(el.eventId));
      } else {
        this.tempOutput = this.tempOutput.filter((el: EventDocument) => el.eventId === query.eventId);
      }
    }

    return this;
  },
  // A search parameter value of 1 is for ascending order, -1 is for descending order
  sort(params: any) {
    if (params?.rank) this.tempOutput.sort((a: EventDocument, b: EventDocument) => params.rank * (a.rank - b.rank));
    return this;
  },
  // Resets the temporary output
  exec() {
    const temp = this.tempOutput;
    this.tempOutput = undefined;
    return temp;
  },
});
