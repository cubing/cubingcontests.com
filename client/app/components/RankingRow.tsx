'use client';

import { useState } from 'react';
import { FaCaretRight, FaCaretDown } from 'react-icons/fa';
import Country from './Country';
import Competitor from './Competitor';
import CompetitionName from '@c/CompetitionName';
import Solves from './Solves';
import { ICompetition, IEvent, IPerson, IResult } from '@sh/interfaces';
import { getFormattedDate, getFormattedTime } from '~/helpers/utilityFunctions';

const RankingRow = ({
  firstColumnValue,
  isFirstRow,
  bestOrAvg,
  result,
  persons,
  competition,
  event,
  showAllTeammates,
  showSolves,
  forRecordsTable = false,
}: {
  firstColumnValue: string | number;
  isFirstRow: boolean;
  bestOrAvg: 'best' | 'average';
  result: IResult;
  // On the rankings page the first person has to be the competitor being ranked, and the rest are teammates
  // (if it's a team event). On the records page the array should just contain one competitor.
  persons: IPerson[];
  competition: ICompetition;
  event: IEvent;
  showAllTeammates: boolean;
  showSolves: boolean;
  forRecordsTable?: boolean;
}) => {
  const [teamExpanded, setTeamExpanded] = useState(false);

  // On the records page we only want the person and country to be shown, if
  const onlyKeepPerson = forRecordsTable && !isFirstRow;
  const personsToDisplay = showAllTeammates ? persons : persons.slice(0, 1);

  return (
    <tr>
      <td>{!onlyKeepPerson && <span className={!isFirstRow ? 'text-secondary' : ''}>{firstColumnValue}</span>}</td>
      <td>
        <div className="d-flex flex-wrap align-items-start gap-2">
          {personsToDisplay.map((person, index) => (
            <span key={person.personId} className="d-flex gap-2">
              <Competitor key={person.personId} person={person} noCountry={!showAllTeammates} />
              {index !== personsToDisplay.length - 1 && <span>&</span>}
            </span>
          ))}
        </div>
      </td>
      <td>{!onlyKeepPerson && getFormattedTime(result[bestOrAvg], event.format)}</td>
      {!showAllTeammates && (
        <td>
          <Country countryIso2={persons[0].countryIso2} />
        </td>
      )}
      <td>{!onlyKeepPerson && getFormattedDate(result.date)}</td>
      <td>
        {!onlyKeepPerson &&
          (competition ? (
            <CompetitionName competition={competition} />
          ) : (
            <div className="d-flex gap-2">
              {result.videoLink && (
                <a href={result.videoLink} target="_blank">
                  Video
                </a>
              )}
              {result.discussionLink && (
                <a href={result.discussionLink} target="_blank">
                  Discussion
                </a>
              )}
            </div>
          ))}
      </td>
      {event?.participants > 1 && !showAllTeammates && (
        <td>
          {persons.length === 2 ? (
            <Competitor person={persons[1]} />
          ) : (
            <div className="d-flex flex-column align-items-start gap-2">
              {/* The style is necessary, because the icon is too tall, so it makes the whole row taller */}
              <span className="mb-2 text-white" style={{ height: '1.5rem', marginTop: '-4px' }}>
                <u style={{ cursor: 'pointer' }} onClick={() => setTeamExpanded(!teamExpanded)}>
                  {teamExpanded ? 'Collapse' : 'Expand'}
                </u>
                <span className="ms-1 fs-5">{teamExpanded ? <FaCaretDown /> : <FaCaretRight />}</span>
              </span>

              {teamExpanded && persons.map((teammate) => <Competitor key={teammate.personId} person={teammate} />)}
            </div>
          )}
        </td>
      )}
      {showSolves && (
        <td>{!onlyKeepPerson && bestOrAvg === 'average' && <Solves event={event} attempts={result.attempts} />}</td>
      )}
    </tr>
  );
};

export default RankingRow;
