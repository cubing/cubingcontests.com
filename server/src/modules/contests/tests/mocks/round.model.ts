import { RoundDocument } from "~/src/models/round.model";
import { IRound } from "@sh/types";
import { contestsStub } from "../stubs/competitions.stub";
import { parseRoundId } from "~/shared_helpers/sharedFunctions";

export const RoundModelMock = (): any => ({
  tempOutput: undefined,
  create(round: IRound): RoundDocument {
    return {
      ...round,
      save() {},
    } as RoundDocument;
  },
  find(): any {
    this.tempOutput = [];

    return this;
  },
  findOne({ competitionId, roundId }: { competitionId: string; roundId: string }): RoundDocument {
    const [eventId] = parseRoundId(roundId);

    this.tempOutput = contestsStub()
      .find((c) => c.competitionId === competitionId)
      .events.find((e) => e.event.eventId === eventId)
      .rounds.find((r) => r.roundId === roundId);

    return this;
  },
  populate() {
    return this;
  },
  updateOne() {
    return this;
  },
  exec(): RoundDocument[] {
    const temp = this.tempOutput;
    this.tempOutput = undefined;
    return temp;
  },
  save() {},
});
