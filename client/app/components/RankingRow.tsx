'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaCaretRight, FaCaretDown } from 'react-icons/fa';
import Country from './Country';
import Competitor from './Competitor';
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
  showCompetitionColumn,
  showSolvesColumn,
  showLinksColumn,
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
  showCompetitionColumn: boolean;
  showSolvesColumn: boolean;
  showLinksColumn: boolean;
  forRecordsTable?: boolean;
}) => {
  const [teamExpanded, setTeamExpanded] = useState(false);

  // On the records page we only want the person and country to be shown, if
  const onlyKeepPerson = forRecordsTable && !isFirstRow;

  return (
    <tr>
      <td>{!onlyKeepPerson && <span className={!isFirstRow ? 'text-secondary' : ''}>{firstColumnValue}</span>}</td>
      <td>
        <Competitor person={persons[0]} noCountry />
      </td>
      <td>{!onlyKeepPerson && getFormattedTime(result[bestOrAvg], event.format)}</td>
      <td>
        <Country countryIso2={persons[0].countryIso2} />
      </td>
      <td>{!onlyKeepPerson && getFormattedDate(result.date)}</td>
      {showCompetitionColumn && (
        <td>
          {!onlyKeepPerson && competition && (
            <Link href={`/competitions/${competition.competitionId}`}>{competition.name}</Link>
          )}
        </td>
      )}
      {!forRecordsTable && event.participants > 1 && (
        <td>
          {persons.length === 2 ? (
            <Competitor person={persons[1]} />
          ) : (
            <div className="d-flex flex-column align-items-start gap-2 m-0 p-0">
              <span className="text-white" onClick={() => setTeamExpanded(!teamExpanded)}>
                <u style={{ cursor: 'pointer' }}>{teamExpanded ? 'Collapse' : 'Expand'}</u>
                <span className="ms-1 fs-5">{teamExpanded ? <FaCaretDown /> : <FaCaretRight />}</span>
              </span>
              {teamExpanded && persons.map((teammate) => <Competitor key={teammate.personId} person={teammate} />)}
            </div>
          )}
        </td>
      )}
      {showSolvesColumn && (
        <td>{!onlyKeepPerson && bestOrAvg === 'average' && <Solves event={event} attempts={result.attempts} />}</td>
      )}
      {showLinksColumn && (
        <td>
          {!onlyKeepPerson && (
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
          )}
        </td>
      )}
    </tr>
  );
};

export default RankingRow;
