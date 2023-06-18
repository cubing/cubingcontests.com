'use client';
import { useState, } from 'react';
import { EventID, IWCIFCompetition, IWCIFEvent, IEventInfo, } from '@sh/WCIF';
import eventsInfo from '~/helpers/WCIFEventsData';

const ContestResults = ({ contest, }: { contest: IWCIFCompetition }) => {
  const [currEvent, setCurrEvent,] = useState<EventID>('333');

  const event: IWCIFEvent = contest.events.find((ev: IWCIFEvent) => ev.id === currEvent) || {
    id: '333',
    rounds: [],
  };
  const events: IEventInfo[] = contest.events.map((ev: IWCIFEvent) => eventsInfo.find((eo) => eo.id === ev.id));

  const getName = (personId: string): string => {
    if (!personId.includes(';')) {
      return contest.persons.find((el) => el.registrantId === personId)?.name || '';
    } else {
      return personId
        .split(';')
        .map((id: string) => contest.persons.find((el) => el.registrantId === id)?.name)
        .join(' & ');
    }
  };

  const formatTime = (time: number, isAverage = false): string => {
    if (time === -1) {
      return 'DNF';
    } else if (time === -2) {
      return 'DNS';
    } else if (event.id === '333fm') {
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

  const getSolves = (attempts: Array<any>): string => {
    return attempts.map((el) => formatTime(el.result)).join(' ');
  };

  return (
    <>
      <div className="my-5 mx-2 d-flex flex-row flex-wrap gap-2">
        {events.map((ev) => (
          <button
            key={ev.id}
            onClick={() => setCurrEvent(ev.id)}
            className={'btn btn-light' + (ev.id === currEvent ? ' active' : '')}
          >
            {ev.name}
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
            {event.rounds[0].results.map((result) => (
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
  );
};

export default ContestResults;
