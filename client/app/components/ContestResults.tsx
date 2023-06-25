'use client';
import { useState } from 'react';
import IEvent from '@sh/interfaces/Event';
import IPerson from '@sh/interfaces/Person';
import { ICompetitionData, ICompetitionEvent } from '@sh/interfaces/Competition';
import { IResult } from '@sh/interfaces/Round';

const ContestResults = ({ data: { competition, eventsInfo, persons } }: { data: ICompetitionData }) => {
  const [currEvent, setCurrEvent] = useState<ICompetitionEvent | null>(
    competition.events ? competition.events[0] : null,
  );

  const currEventInfo = eventsInfo.find((el) => el.eventId === currEvent?.eventId) || null;

  const getName = (personId: string): string => {
    if (!persons || personId === '') throw new Error('Name not found');

    // To account for team events that have multiple people separated by ;
    return personId
      .split(';')
      .map((id: string) => persons.find((el: IPerson) => el.personId.toString() === id)?.name || 'Error')
      .join(' & ');
  };

  const formatTime = (time: number, isAverage = false): string => {
    if (time === -1) {
      return 'DNF';
    } else if (time === -2) {
      return 'DNS';
    } else if (currEventInfo?.format === 'number') {
      if (isAverage) return (time / 100).toFixed(2);
      else return time.toString();
    } else {
      let output = '';
      const hours = Math.floor(time / 360000);
      const minutes = Math.floor(time / 6000) % 60;
      const seconds = (time - hours * 360000 - minutes * 6000) / 100;

      if (hours > 0) output = hours + ':';
      if (hours > 0 || minutes > 0) {
        if (minutes === 0) output += '00:';
        else if (minutes < 10 && hours > 0) output += '0' + minutes + ':';
        else output += minutes + ':';
      }
      if (seconds < 10 && (hours > 0 || minutes > 0)) output += '0';
      output += seconds;
      if (!output.includes('.')) output += '.00';
      else if (output.split('.')[1].length === 1) output += '0';

      return output;
    }
  };

  const getSolves = (attempts: number[]): string => {
    // The character in quotes is an em space
    return attempts.map((el) => formatTime(el)).join(' ');
  };

  return (
    <>
      <div className="mt-5 mb-3 fs-5">
        <p>
          Location:&#8194;
          <b>
            {competition.city}, {competition.countryId}
          </b>
        </p>
        {competition.participants && (
          <p>
            Number of participants:&#8194;<b>{competition.participants}</b>
          </p>
        )}
      </div>
      {!competition.events ? (
        <p className="fs-5">The results for this competition have not been posted yet</p>
      ) : (
        <>
          <div className="mb-5 mx-2 d-flex flex-row flex-wrap gap-2">
            {eventsInfo.map((event: IEvent) => (
              <button
                key={event.eventId}
                onClick={() =>
                  setCurrEvent(
                    competition.events?.find((el: ICompetitionEvent) => el.eventId === event.eventId) || null,
                  )
                }
                className={'btn btn-light' + (currEvent?.eventId === event.eventId ? ' active' : '')}
              >
                {event.name}
              </button>
            ))}
          </div>
          <div className="flex-grow-1 table-responsive">
            <table className="table table-hover table-responsive text-nowrap">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Best</th>
                  <th>Average</th>
                  <th>Solves</th>
                </tr>
              </thead>
              <tbody>
                {currEvent?.rounds[0].results.map((result: IResult) => (
                  <tr key={result.personId}>
                    <td>{result.ranking}</td>
                    <td>{getName(result.personId)}</td>
                    <td>{formatTime(result.best)}</td>
                    <td>{formatTime(result.average, true)}</td>
                    <td>{getSolves(result.attempts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
};

export default ContestResults;
