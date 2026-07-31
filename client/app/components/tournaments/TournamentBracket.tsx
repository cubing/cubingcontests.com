"use client";

import { useMemo } from "react";
import { C } from "~/helpers/constants.ts";
import type { MatchResponse } from "~/server/db/schema/matches.ts";
import type { PersonResponse } from "~/server/db/schema/persons.ts";
import type { RegionResponse } from "~/server/db/schema/regions.ts";
import type { Bracket } from "~/server/db/schema/rounds.ts";
import type { SetResponse } from "~/server/db/schema/sets.ts";
import BracketMatchup from "./BracketMatchup.tsx";

type Props = {
  bracket: Bracket;
  matches: MatchResponse[];
  persons: PersonResponse[];
  regions: RegionResponse[];
  sets: SetResponse[];
};

function TournamentBracket({ bracket, matches, persons, regions, sets }: Props) {
  const matchesByStage = useMemo(() => {
    const grouped = new Map<number, MatchResponse[]>();
    for (const match of matches) {
      if (match.bracketNumber !== bracket.bracketNumber) continue;
      if (grouped.has(match.stage)) grouped.get(match.stage)!.push(match);
      else grouped.set(match.stage, [match]);
    }
    return grouped;
  }, [bracket.bracketNumber, matches]);

  const totalMatches = 17;
  // const totalMatches = matches.filter((m) => m.bracketNumber === bracket.bracketNumber).length;
  const useBracketDisplay = totalMatches <= C.maxMatchesForTournamentDisplay;

  // Calculate grid row position for a match
  // For stage S (1-indexed) with position P (1-indexed) in a bracket with N stages:
  // row = 2^(S-1) + (2^S) * (P-1)
  // This gives the traditional bracket layout:
  // Stage 1: rows 1, 3, 5, 7... (for N>=1)
  // Stage 2: rows 2, 6, 10... (for N>=2)
  // Stage 3: rows 4, 12, 20... (for N>=3)
  const getGridRow = (match: MatchResponse): number => {
    return 2 ** (match.stage - 1) + 2 ** match.stage * (match.position - 1);
  };

  return (
    <div
      className="px-2"
      style={
        useBracketDisplay
          ? {
              display: "grid",
              gridTemplateColumns: `repeat(${bracket.stages}, 1fr)`,
              gap: "0.5rem",
              width: "100%",
              alignItems: "start",
              overflowX: "auto",
            }
          : {}
      }
    >
      {Array.from(matchesByStage.entries()).map(([stage, stageMatches]) => (
        <div key={stage}>
          <h3 className="mb-3">Group A</h3>
          <div style={useBracketDisplay ? { gridColumn: stage } : { width: "fit-content", maxWidth: "900px" }}>
            {stageMatches
              // .sort((a, b) => a.position - b.position)
              .map((match) => (
                // <div
                //   key={match.id}
                //   style={useBracketDisplay ? { gridRow: `${getGridRow(match)} / span 1`, width: "100%" } : {}}
                // >
                <BracketMatchup
                  key={match.id}
                  match={match}
                  persons={persons}
                  regions={regions}
                  sets={sets.filter((s) => s.matchId === match.id)}
                  useBracketDisplay={useBracketDisplay}
                />
                // </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default TournamentBracket;
