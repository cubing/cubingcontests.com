"use client";

import { Alg } from "cubing/alg";
import { TwistyPlayer } from "cubing/twisty";
import { useAction } from "next-safe-action/hooks";
import { use, useContext, useEffect, useRef, useState } from "react";
import Button from "~/app/components/UI/Button.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { MainContext } from "~/helpers/contexts.ts";
import { type NxNMove, nxnMoves } from "~/helpers/types/NxNMove.ts";
import { getActionError } from "~/helpers/utility-functions.ts";
import type { CurrentCollectiveSolution } from "~/server/db/schema/collective-solutions.ts";
import {
  getCurrentCollectiveCubingSolutionSF,
  makeCollectiveCubingMoveSF,
  startNewCollectiveCubingSolutionSF,
} from "~/server/server-functions/server-functions.ts";

export function getIsWebglSupported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const webglContext = canvas.getContext("webgl");
    const webglExperimentalContext = canvas.getContext("experimental-webgl");

    return !!window.WebGLRenderingContext && !!webglContext && !!webglExperimentalContext;
  } catch (_e) {
    return false;
  }
}

type Props = {
  settingValuePromise: Promise<string | null>;
};

function CollectiveCubing({ settingValuePromise }: Props) {
  const { changeErrorMessages, resetMessages } = useContext(MainContext);

  const settingValue = use(settingValuePromise);
  const { executeAsync: getCurrentCollectiveSolution } = useAction(getCurrentCollectiveCubingSolutionSF);
  const { executeAsync: startNewSolution, isPending: isScrambling } = useAction(startNewCollectiveCubingSolutionSF);
  const { executeAsync: makeMove, isPending: isMakingMove } = useAction(makeCollectiveCubingMoveSF);
  // undefined means it's not been fetched yet; null means a solution has never been started
  const [collectiveSolution, setCollectiveSolution] = useState<CurrentCollectiveSolution | null | undefined>();
  const [selectedMove, setSelectedMove] = useState<NxNMove | null>(null);
  const twistyPlayerContainerRef = useRef<HTMLDivElement | null>(null);
  const twistyPlayerRef = useRef<TwistyPlayer | null>(null);

  const isSolved = !collectiveSolution || collectiveSolution.state === "solved";
  const numberOfSolves = collectiveSolution
    ? collectiveSolution.attemptNumber - (collectiveSolution.state === "ongoing" ? 1 : 0)
    : 0;

  useEffect(() => {
    if (settingValue === "true") {
      (async () => {
        const res = await getCurrentCollectiveSolution();

        if (res.serverError || res.validationErrors) changeErrorMessages([getActionError(res)]);
        else setCollectiveSolution(res.data);
      })();
    }
  }, [settingValue]);

  useEffect(() => {
    if (collectiveSolution !== undefined && !twistyPlayerRef.current && twistyPlayerContainerRef.current) {
      if (!getIsWebglSupported()) changeErrorMessages(["Please enable WebGL to render the cube"]);
      else updatePuzzleState(collectiveSolution);
    }
  }, [collectiveSolution]);

  const updatePuzzleState = (newSolution: CurrentCollectiveSolution | null, reset = false) => {
    setCollectiveSolution(newSolution);

    const alg =
      newSolution?.state === "ongoing" ? new Alg(newSolution.scramble).concat(newSolution.solution) : new Alg();

    if (reset) {
      twistyPlayerContainerRef.current!.removeChild(twistyPlayerRef.current!);
      twistyPlayerRef.current = null;
    }

    if (!twistyPlayerRef.current) {
      twistyPlayerRef.current = new TwistyPlayer({
        puzzle: "2x2x2",
        alg,
        hintFacelets: "none",
        controlPanel: "none",
        background: "none",
        visualization: "PG3D", // makes the puzzle black
      });

      twistyPlayerContainerRef.current!.appendChild(twistyPlayerRef.current);
    } else {
      twistyPlayerRef.current.alg = alg;
    }
  };

  const scramblePuzzle = async () => {
    resetMessages();
    const res = await startNewSolution();

    if (res.serverError || res.validationErrors) {
      if (res.serverError?.data) updatePuzzleState(res.serverError.data);
      changeErrorMessages([getActionError(res)]);
    } else {
      updatePuzzleState(res.data!);
      resetMessages();
    }
  };

  const submitMove = async () => {
    if (collectiveSolution && selectedMove) {
      resetMessages();
      const res = await makeMove({ move: selectedMove, lastSeenSolution: collectiveSolution.solution });

      if (res.serverError || res.validationErrors) {
        if (res.serverError?.data) updatePuzzleState(res.serverError.data.isSolved ? null : res.serverError.data);
        changeErrorMessages([getActionError(res)]);
      } else {
        // Applying the move this way instead of using updatePuzzleState() so that the animation is shown
        twistyPlayerRef.current!.experimentalAddMove(selectedMove);
        setCollectiveSolution(res.data!);
        resetMessages();
      }

      setSelectedMove(null);
    }
  };

  const onConfirmKeybind = (e: any) => {
    if (e.key === "Enter" && e.ctrlKey) submitMove();
  };

  if (settingValue !== "true") return;

  return (
    <>
      <h3 className="rr-basic-heading">Collective Cubing</h3>

      <p>
        Let's solve a Rubik's Cube together! Simply log in and make a turn. You may not make two turns in a row. After
        selecting a move, submit with Ctrl + Enter as a shortcut.
      </p>

      <ToastMessages />

      {collectiveSolution !== undefined && (
        <div className="row gap-3">
          <div className="col-md-4">
            <div className="d-flex flex-column align-items-center">
              <div
                ref={twistyPlayerContainerRef}
                className="d-flex justify-content-center overflow-hidden"
                style={{ maxWidth: "100%" }}
              />

              {isSolved && (
                <>
                  {collectiveSolution?.currentUserInteractedLast && (
                    <p className="my-1 text-warning">You are the last user who interacted with the puzzle</p>
                  )}
                  <Button
                    id="scramble_button"
                    onClick={scramblePuzzle}
                    isLoading={isScrambling}
                    disabled={collectiveSolution?.currentUserInteractedLast}
                    className="btn-success mt-2 mb-4 w-100"
                  >
                    Scramble
                  </Button>
                </>
              )}
              <p>
                All-time number of solves: <b>{numberOfSolves}</b>
              </p>
            </div>
          </div>
          <div className="col-md-8" style={{ maxWidth: "500px" }}>
            {!isSolved && (
              <>
                {collectiveSolution.currentUserInteractedLast && (
                  <p className="mb-3 text-warning">You are the last user who interacted with the puzzle</p>
                )}
                <div
                  className="mt-md-4 gap-1 gap-md-3"
                  style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)" }}
                >
                  {nxnMoves.map((move) => (
                    <div key={move} className="p-0">
                      <button
                        type="button"
                        onClick={() => setSelectedMove(move)}
                        disabled={isMakingMove || collectiveSolution.currentUserInteractedLast}
                        onKeyDown={selectedMove === move ? onConfirmKeybind : undefined}
                        className={`btn btn-primary ${selectedMove === move ? "active" : ""} w-100`}
                      >
                        {move}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="my-3 my-md-4">
                  <Button
                    id="confirm_button"
                    onClick={submitMove}
                    disabled={!selectedMove}
                    isLoading={isMakingMove}
                    className="btn-success w-100"
                  >
                    Confirm
                  </Button>
                </div>
                <div className="d-flex justify-content-between my-3 gap-3 align-items-center">
                  <p className="m-0">
                    Moves used:{" "}
                    <b>
                      {collectiveSolution?.solution ? (collectiveSolution.solution.match(/ /g)?.length ?? 0) + 1 : 0}
                    </b>
                  </p>
                  <Button onClick={() => updatePuzzleState(collectiveSolution, true)} className="btn-xs btn-secondary">
                    Reset Orientation
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default CollectiveCubing;
