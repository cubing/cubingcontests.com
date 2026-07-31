"use client";

import { faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Competitors from "~/app/components/Competitors.tsx";
import Button from "~/app/components/UI/Button.tsx";
import { C } from "~/helpers/constants.ts";
import type { MatchResponse } from "~/server/db/schema/matches.ts";
import type { PersonResponse } from "~/server/db/schema/persons.ts";
import type { RegionResponse } from "~/server/db/schema/regions.ts";
import type { SetResponse } from "~/server/db/schema/sets.ts";

type Props = {
  match: MatchResponse;
  sets: SetResponse[]; // should only include the sets for this match
  persons: PersonResponse[];
  regions: RegionResponse[];
  useBracketDisplay: boolean;
};

function BracketMatchup({ match, sets, persons, regions, useBracketDisplay }: Props) {
  const team1Persons = match.team1.participantIds.map((pid) => persons.find((p) => p.id === pid));
  const team2Persons = match.team2.participantIds.map((pid) => persons.find((p) => p.id === pid));

  const team1SetsWon = sets.filter((s) => s.setWinner === "1").length;
  const team2SetsWon = sets.filter((s) => s.setWinner === "2").length;

  if (!useBracketDisplay) {
    return (
      <>
        <h4 className="mt-3 mb-2">Match {match.position}</h4>
        <div
          className="d-grid w-full gap-4 rounded border bg-body-tertiary p-3"
          style={{ gridTemplateColumns: "35fr 5fr 8fr 5fr 35fr 5fr" }}
        >
          <Competitors persons={team1Persons} regions={regions} vertical />
          <TeamScore score={team1SetsWon} isWinner={match.winner === "1"} />
          {sets.length === 1 && (
            <div className="fs-5 d-flex gap-4 text-nowrap rounded rounded-4 border bg-body-tertiary px-3 py-2 align-self-center">
              <span className={match.winner === "1" ? "text-success" : ""}>
                {sets[0].attemptWinners.filter((aw) => aw === "1").length}
              </span>
              <span className={match.winner === "2" ? "text-success" : ""}>
                {sets[0].attemptWinners.filter((aw) => aw === "2").length}
              </span>
            </div>
          )}
          <TeamScore score={team2SetsWon} isWinner={match.winner === "2"} />
          <div className="d-flex flex-column flex-grow-1 gap-1">
            <Competitors persons={team2Persons} regions={regions} vertical />
          </div>
          <Button className="btn-link text-nowrap align-self-center">
            <FontAwesomeIcon icon={faEye} className="me-2" />
            View
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className="d-flex flex-column rounded border bg-body-tertiary p-3">
      <TeamRow team="1" match={match} sets={sets} persons={team1Persons} regions={regions} />
      <hr className="my-3 border-secondary opacity-50" />
      <TeamRow team="2" match={match} sets={sets} persons={team2Persons} regions={regions} />
    </div>
  );
}

type TeamRowProps = {
  team: "1" | "2";
  match: MatchResponse;
  sets: SetResponse[];
  persons: (PersonResponse | undefined)[];
  regions: RegionResponse[];
};

function TeamRow({ team, match, sets, persons, regions }: TeamRowProps) {
  return (
    <div className="d-flex gap-3 ps-2">
      <div className="flex-grow-1">
        <Competitors persons={persons} regions={regions} vertical />
      </div>
      <TeamScore score={sets.filter((s) => s.setWinner === team).length} isWinner={match.winner === team} />
    </div>
  );
}

type TeamScoreProps = {
  score: number;
  isWinner: boolean;
};

function TeamScore({ score, isWinner }: TeamScoreProps) {
  return (
    <div
      className={`fs-5 d-flex justify-content-center h-full rounded align-items-center ${isWinner ? "" : "bg-body-secondary"}`}
      style={{
        width: "2.5rem",
        ...(isWinner ? { backgroundColor: C.color.rankingHighlight, color: "black" } : {}),
      }}
    >
      {score}
    </div>
  );
}

export default BracketMatchup;
