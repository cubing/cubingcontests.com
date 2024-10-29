"use client";

import { useContext, useEffect, useState } from "react";
import { TwistyPlayer } from "cubing/twisty";
// import { keyToMove } from 'cubing/alg';
import { useMyFetch } from "~/helpers/customHooks.ts";
import { FetchObj, IFeCollectiveSolution, IMakeMoveDto, NxNMove } from "~/shared_helpers/types.ts";
import { nxnMoves } from "~/shared_helpers/types/NxNMove.ts";
import { Color } from "~/shared_helpers/enums.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { getIsWebglSupported } from "~/helpers/utilityFunctions.ts";
import Button from "~/app/components/UI/Button.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";

const addTwistyPlayerElement = (alg = "") => {
  const twistyPlayerElements = document.getElementsByTagName("twisty-player");
  if (twistyPlayerElements.length > 0) twistyPlayerElements[0].remove();

  const twistyPlayer = new TwistyPlayer({
    puzzle: "3x3x3",
    alg,
    hintFacelets: "none",
    controlPanel: "none",
    background: "none",
    visualization: "PG3D", // makes the puzzle black
  });

  const containerDiv = document.getElementById("twisty_player_container");
  if (containerDiv) containerDiv.appendChild(twistyPlayer);
};

const getCubeState = (colSol: IFeCollectiveSolution): string => `${colSol.scramble} z2 ${colSol.solution}`.trim();

const CollectiveCubing = () => {
  const myFetch = useMyFetch();
  const { changeErrorMessages, loadingId, changeLoadingId, resetMessagesAndLoadingId } = useContext(MainContext);

  const [collectiveSolution, setCollectiveSolution] = useState<IFeCollectiveSolution>();
  const [selectedMove, setSelectedMove] = useState<NxNMove | null>(null);

  const isSolved = !collectiveSolution || collectiveSolution.state === 20;
  const numberOfSolves = collectiveSolution
    ? collectiveSolution.attemptNumber - (collectiveSolution.state < 20 ? 1 : 0)
    : 0;

  useEffect(() => {
    if (!getIsWebglSupported()) {
      changeErrorMessages(["Please enable WebGL to render the cube"]);
      return;
    }

    // const doMoveWithKeyboard = (e: KeyboardEvent) => {
    //   const move = keyToMove(e)?.toString();
    //   console.log(move);
    // selectMoveWithKeyboard(move as NxNMove);
    // };

    myFetch.get("/collective-solution").then(({ payload, errors }: FetchObj<IFeCollectiveSolution>) => {
      if (!errors) {
        if (payload) {
          setCollectiveSolution(payload);
          addTwistyPlayerElement(getCubeState(payload));
        } else {
          addTwistyPlayerElement();
        }

        // addEventListener('keypress', doMoveWithKeyboard);
      }
    });

    // return () => removeEventListener('keypress', doMoveWithKeyboard);
  }, []);

  const update = ({ payload, errors, errorData }: FetchObj<IFeCollectiveSolution>) => {
    const newCollectiveSolution = payload ?? errorData?.collectiveSolution;

    if (errors) {
      changeErrorMessages(errors);
    } else if (newCollectiveSolution) {
      resetMessagesAndLoadingId();
      setCollectiveSolution(newCollectiveSolution);
      addTwistyPlayerElement(getCubeState(newCollectiveSolution));
    }

    setSelectedMove(null);
  };

  const scrambleCube = async () => {
    changeLoadingId("scramble_button");
    const fetchData = await myFetch.post("/collective-solution", {}, { loadingId: null });
    update(fetchData);
  };

  const selectMove = (move: NxNMove) => {
    setSelectedMove(move);
    document.getElementById("confirm_button")?.focus();
  };

  const confirmMove = async () => {
    if (collectiveSolution && selectedMove) {
      changeLoadingId("confirm_button");
      const makeMoveDto: IMakeMoveDto = { move: selectedMove, lastSeenSolution: collectiveSolution.solution };
      const fetchData = await myFetch.post("/collective-solution/make-move", makeMoveDto, { loadingId: null });
      update(fetchData);
    }
  };

  const coloredTextStyles = "px-1 bg-dark rounded";

  return (
    <>
      <p>
        Let's solve Rubik's Cubes together! Simply log in and make a turn.{" "}
        <b className={coloredTextStyles} style={{ color: `#${Color.Yellow}` }}>U</b> is the{" "}
        <b className={coloredTextStyles} style={{ color: `#${Color.Yellow}` }}>yellow</b> face and{" "}
        <b className={coloredTextStyles} style={{ color: `#${Color.Green}` }}>F</b> is{" "}
        <b className={coloredTextStyles} style={{ color: `#${Color.Green}` }}>green</b>. You may not make two turns in a
        row.
      </p>

      <ToastMessages />

      {collectiveSolution && (
        <>
          {collectiveSolution && <p>Scramble: {collectiveSolution.scramble}</p>}

          <div className="row gap-3">
            <div className="col-md-4">
              <div className="d-flex flex-column align-items-center">
                <div id="twisty_player_container" style={{ maxWidth: "100%" }} />
                {isSolved && (
                  <Button
                    id="scramble_button"
                    onClick={scrambleCube}
                    loadingId={loadingId}
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
                          onClick={() => selectMove(move)}
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
                      onClick={confirmMove}
                      disabled={!selectedMove}
                      loadingId={loadingId}
                      className="btn-success w-100"
                    >
                      Confirm
                    </Button>
                  </div>
                  <p className="my-2">
                    Moves used:{" "}
                    <b>
                      {collectiveSolution?.solution ? (collectiveSolution.solution.match(/ /g)?.length ?? 0) + 1 : 0}
                    </b>
                  </p>
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
