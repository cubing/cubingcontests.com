"use client";

import { useContext, useEffect, useState, useTransition } from "react";
import { TwistyPlayer } from "cubing/twisty";
import { Alg } from "cubing/alg";
import type { FetchObj, NxNMove } from "~/helpers/types.ts";
import { nxnMoves } from "~/helpers/types/NxNMove.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { getIsWebglSupported } from "~/helpers/utilityFunctions.ts";
import Button from "~/app/components/UI/Button.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { makeCollectiveCubingMove, startNewCollectiveCubingSolution } from "~/server/serverFunctions";
import { CollectiveSolutionResponse } from "~/server/db/schema/collective-solutions";

const addTwistyPlayerElement = (alg = new Alg()) => {
  const twistyPlayerElements = document.getElementsByTagName("twisty-player");
  if (twistyPlayerElements.length > 0) twistyPlayerElements[0].remove();

  const twistyPlayer = new TwistyPlayer({
    puzzle: "2x2x2",
    alg,
    hintFacelets: "none",
    controlPanel: "none",
    background: "none",
    visualization: "PG3D", // makes the puzzle black
  });

  const containerDiv = document.getElementById("twisty_player_container");
  if (containerDiv) containerDiv.appendChild(twistyPlayer);
};

type Props = {
  collectiveSolutionResponse: FetchObj<CollectiveSolutionResponse | null>;
};

const CollectiveCubing = ({ collectiveSolutionResponse }: Props) => {
  const { changeErrorMessages, resetMessages } = useContext(MainContext);

  // undefined means it's not been set during the page load yet; null means a solution has never been started
  const [collectiveSolution, setCollectiveSolution] = useState<CollectiveSolutionResponse | null | undefined>(null);
  const [selectedMove, setSelectedMove] = useState<NxNMove | null>(null);

  const [isPending, startTransition] = useTransition();

  const isSolved = !collectiveSolution || collectiveSolution.state === "solved";
  const numberOfSolves = collectiveSolution
    ? collectiveSolution.attemptNumber - (collectiveSolution.state === "ongoing" ? 1 : 0)
    : 0;

  useEffect(() => {
    if (!getIsWebglSupported()) {
      changeErrorMessages(["Please enable WebGL to render the cube"]);
      return;
    }

    if (!collectiveSolutionResponse.success) {
      changeErrorMessages(["Unknown error"]);
    } else {
      update(collectiveSolutionResponse.data);
    }
  }, []);

  const update = (newSolution: CollectiveSolutionResponse | null) => {
    setCollectiveSolution(newSolution);
    addTwistyPlayerElement(newSolution ? new Alg(newSolution.scramble).concat(newSolution.solution) : new Alg());
  };

  const scramblePuzzle = () => {
    startTransition(async () => {
      const res = await startNewCollectiveCubingSolution();

      if (!res.success) {
        if (res.error.code === "CONFLICT") {
          update(res.error.data!);
          changeErrorMessages(["The cube has already been scrambled"]);
        }
      } else {
        update(res.data);
        resetMessages();
      }
    });
  };

  const submitMove = () => {
    if (collectiveSolution && selectedMove) {
      startTransition(async () => {
        const res = await makeCollectiveCubingMove({
          move: selectedMove,
          lastSeenSolution: collectiveSolution.solution,
        });

        if (!res.success) {
          if (res.error.code === "OUT_OF_DATE") {
            update(res.error.data!);
            changeErrorMessages(["The state of the cube has changed before your move"]);
          } else if (res.error.code === "NO_ONGOING_SOLUTION") {
            changeErrorMessages(["The puzzle hasn't been scrambled yet"]);
          } else if (
            ["VALIDATION", "CANT_MAKE_MOVE"].includes(res.error.code)
          ) {
            changeErrorMessages([res.error.message!]);
          }
        } else {
          update(res.data);
          resetMessages();
        }

        setSelectedMove(null);
      });
    }
  };

  // const coloredTextStyles = "px-1 bg-dark rounded";

  return (
    <>
      <p>
        Let's solve Rubik's Cubes together! Simply log in and make a turn. {
          /* <b className={coloredTextStyles} style={{ color: `#${Color.Yellow}` }}>
          U
        </b>{" "}
        is the{" "}
        <b className={coloredTextStyles} style={{ color: `#${Color.Yellow}` }}>
          yellow
        </b>{" "}
        face and{" "}
        <b className={coloredTextStyles} style={{ color: `#${Color.Green}` }}>
          F
        </b>{" "}
        is{" "}
        <b className={coloredTextStyles} style={{ color: `#${Color.Green}` }}>
          green
        </b>. */
        }
        You may not make two turns in a row.
      </p>

      <ToastMessages />

      {collectiveSolution !== undefined && (
        <>
          <div className="row gap-3">
            <div className="col-md-4">
              <div className="d-flex flex-column align-items-center">
                <div id="twisty_player_container" style={{ maxWidth: "100%" }} />
                {isSolved && (
                  <Button
                    id="scramble_button"
                    onClick={scramblePuzzle}
                    isLoading={isPending}
                    className="btn-success w-100 mt-2 mb-4"
                  >
                    Scramble
                  </Button>
                )}
                <p>
                  All-time number of solves: <b>{numberOfSolves}</b>
                </p>
              </div>
            </div>
            <div className="col-md-8 " style={{ maxWidth: "500px" }}>
              {!isSolved && (
                <>
                  <div
                    className="gap-1 gap-md-3 mt-1 mt-md-4"
                    style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)" }}
                  >
                    {nxnMoves.map((move) => (
                      <div key={move} className="p-0">
                        <button
                          type="button"
                          onClick={() => setSelectedMove(move)}
                          className={`btn btn-primary ${selectedMove === move ? "active" : ""} w-100`}
                        >
                          {move}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="my-3 my--md-4">
                    <Button
                      id="confirm_button"
                      onClick={submitMove}
                      disabled={!selectedMove}
                      isLoading={isPending}
                      className="btn-success w-100"
                    >
                      Confirm
                    </Button>
                  </div>
                  <div className="d-flex justify-content-between align-items-center gap-3 my-3">
                    <p className="m-0">
                      Moves used:{" "}
                      <b>
                        {collectiveSolution?.solution ? (collectiveSolution.solution.match(/ /g)?.length ?? 0) + 1 : 0}
                      </b>
                    </p>
                    <Button
                      onClick={() => update(collectiveSolution)}
                      disabled={isPending}
                      className="btn-xs btn-secondary"
                    >
                      Reset Orientation
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default CollectiveCubing;
