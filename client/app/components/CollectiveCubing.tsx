'use client';

import { useEffect, useState } from 'react';
import { TwistyPlayer } from 'cubing/twisty';
import { randomScrambleForEvent } from 'cubing/scramble';
import myFetch, { FetchObj } from '~/helpers/myFetch';
import Button from '@c/UI/Button';
import { IFeCollectiveSolution, NxNMove } from '@sh/types';

const cubeMoves: [NxNMove[], NxNMove[], NxNMove[]] = [
  ['Z' as NxNMove, 'L', 'F', 'R', 'B', 'D'],
  ["U'", "L'", "F'", "R'", "B'", "D'"],
  ['U2', 'L2', 'F2', 'R2', 'B2', 'D2'],
];

const addTwistyPlayerElement = async (alg = '') => {
  const twistyPlayerElements = document.getElementsByTagName('twisty-player');
  if (twistyPlayerElements.length > 0) twistyPlayerElements[0].remove();

  const twistyPlayer = new TwistyPlayer({
    puzzle: '3x3x3',
    alg,
    hintFacelets: 'none',
    controlPanel: 'none',
    background: 'none',
  });

  const containerDiv = document.getElementById('twisty_player_container');
  containerDiv.appendChild(twistyPlayer);
};

const getCubeState = (colSol: IFeCollectiveSolution): string => `${colSol.scramble} z2 ${colSol.solution}`.trim();

const CollectiveCubing = () => {
  const [loadingId, setLoadingId] = useState('');
  const [collectiveSolutionError, setCollectiveSolutionError] = useState('');
  const [collectiveSolution, setCollectiveSolution] = useState<IFeCollectiveSolution>();
  const [selectedMove, setSelectedMove] = useState<NxNMove>();

  const isSolved = !collectiveSolution || collectiveSolution.state === 20;

  useEffect(() => {
    myFetch.get('/collective-solution').then(({ payload, errors }: FetchObj<IFeCollectiveSolution>) => {
      if (errors) {
        setCollectiveSolutionError(errors[0]);
      } else if (payload) {
        setCollectiveSolution(payload);
        addTwistyPlayerElement(getCubeState(payload));
      } else {
        addTwistyPlayerElement();
      }
    });
  }, []);

  const scrambleCube = async () => {
    setLoadingId('scramble_button');

    const eventId = '333';
    const scramble = (await randomScrambleForEvent(eventId)).toString();

    const { payload, errors }: FetchObj<IFeCollectiveSolution> = await myFetch.post('/collective-solution', {
      eventId,
      scramble,
    });

    if (errors) {
      setCollectiveSolutionError(errors[0]);
      setLoadingId('');
    } else if (payload) {
      setCollectiveSolution(payload);
      addTwistyPlayerElement(getCubeState(payload));
      setCollectiveSolutionError('');
      setLoadingId('');
    }
  };

  const confirmMove = async () => {
    setLoadingId('confirm_button');

    const { payload, errors } = await myFetch.post(`/collective-solution/${selectedMove}`, {});

    if (errors) {
      setCollectiveSolutionError(errors[0]);
      setLoadingId('');
    } else if (payload) {
      setCollectiveSolution(payload);
      addTwistyPlayerElement(getCubeState(payload));
      setCollectiveSolutionError('');
      setLoadingId('');
    }
  };

  return (
    <>
      <p>
        Let's solve Rubik's Cubes together! Simply log in and make a turn. U is the yellow face, F is the green face.
        You may not make two turns in a row.
      </p>

      {collectiveSolutionError ? (
        <p className="text-danger">{collectiveSolutionError}</p>
      ) : (
        collectiveSolution && <p>Scramble: {collectiveSolution.scramble}</p>
      )}

      <div className="row">
        <div className="col-4">
          <div id="twisty_player_container"></div>
          {isSolved && (
            <Button
              id="scramble_button"
              text="Scramble"
              onClick={scrambleCube}
              loadingId={loadingId}
              className="btn-success w-100 mt-2 mb-4"
            />
          )}
          <p>Total solves: {collectiveSolution ? collectiveSolution.attemptNumber - 1 : 0}</p>
        </div>
        <div className="col-8" style={{ maxWidth: '500px' }}>
          {!isSolved && (
            <>
              {cubeMoves.map((row, index) => (
                <div key={index} className="row my-3">
                  {row.map((move) => (
                    <div key={move} className="col">
                      <button
                        type="button"
                        onClick={() => setSelectedMove(move)}
                        className={`btn btn-primary ${selectedMove === move ? 'active' : ''} w-100`}
                      >
                        {move}
                      </button>
                    </div>
                  ))}
                </div>
              ))}
              <div className="row p-2">
                <Button
                  id="confirm_button"
                  text="Confirm"
                  onClick={confirmMove}
                  disabled={!selectedMove}
                  loadingId={loadingId}
                  className="btn-success"
                />
              </div>
              <div className="row p-3">
                Moves used: {collectiveSolution?.solution ? collectiveSolution.solution.match(/ /g).length + 1 : 0}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CollectiveCubing;
