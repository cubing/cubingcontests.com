import { RoundDocument } from '~/src/models/round.model';
import { IRound } from '@sh/interfaces';

export const mockRoundModel = (): any => ({
  create(round: IRound): RoundDocument {
    return round as RoundDocument;
  },
  find(): any {
    return this;
  },
  updateOne() {
    return this;
  },
  exec(): RoundDocument[] {
    return [];
  },
});
