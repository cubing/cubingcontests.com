'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import Country from '@c/Country';
import Competitor from '@c/Competitor';
import ContestName from '@c/ContestName';
import Solves from '@c/Solves';
import RankingLinks from '@c/RankingLinks';
import Competitors from '@c/Competitors';
import { IEvent, IPerson, IRanking } from '@sh/types';
import { getFormattedTime } from '@sh/sharedFunctions';
import { getFormattedDate } from '~/helpers/utilityFunctions';

// THIS IS A TEMPORARY SOLUTION UNTIL I18N IS ADDED. The records page has this same function too.
const getRecordType = (type: 'single' | 'average' | 'mean'): string => {
  return type[0].toUpperCase() + type.slice(1);
};

const RankingRow = ({
  isTiedRanking,
  onlyKeepPerson = false,
  event,
  ranking,
  person,
  showAllTeammates,
  showTeamColumn = false,
  showDetailsColumn,
  forRecordsTable = false,
}: {
  isTiedRanking?: boolean;
  onlyKeepPerson?: boolean;
  event: IEvent;
  ranking: IRanking;
  person: IPerson; // the person being ranked
  showAllTeammates: boolean;
  showTeamColumn?: boolean;
  showDetailsColumn: boolean;
  forRecordsTable?: boolean;
}) => {
  const [teamExpanded, setTeamExpanded] = useState(false);
  const firstColumnValue = ranking.ranking || getRecordType(ranking.type);
  const personsToDisplay = showAllTeammates ? ranking.persons : [person];

  /////////////////////////////////////////////////////////////////////////////////////////
  // REMEMBER TO UPDATE THE MOBILE VIEW OF THE RECORDS PAGE IN ACCORDANCE WITH THIS
  /////////////////////////////////////////////////////////////////////////////////////////

  return (
    <tr>
      <td>{!onlyKeepPerson && <span className={isTiedRanking ? 'text-secondary' : ''}>{firstColumnValue}</span>}</td>
      <td>
        <Competitors persons={personsToDisplay} noFlag={!showAllTeammates} />
      </td>
      <td>{!onlyKeepPerson && getFormattedTime(ranking.result, { event, showMultiPoints: !forRecordsTable })}</td>
      {!showAllTeammates && (
        <td>
          <Country countryIso2={person.countryIso2} shorten />
        </td>
      )}
      <td>{!onlyKeepPerson && getFormattedDate(ranking.date)}</td>
      <td>
        {!onlyKeepPerson &&
          (ranking.contest ? <ContestName contest={ranking.contest} /> : <RankingLinks ranking={ranking} />)}
      </td>
      {showTeamColumn && (
        <td>
          <div className="d-flex flex-column align-items-start gap-2 fs-6">
            <span className="text-white">
              <u style={{ cursor: 'pointer' }} onClick={() => setTeamExpanded(!teamExpanded)}>
                {teamExpanded ? 'Close' : 'Open'}
              </u>
              <span className="ms-2">
                {teamExpanded ? <FontAwesomeIcon icon={faCaretDown} /> : <FontAwesomeIcon icon={faCaretRight} />}
              </span>
            </span>

            {teamExpanded && ranking.persons.map((p) => <Competitor key={p.personId} person={p} />)}
          </div>
        </td>
      )}
      {showDetailsColumn && (
        <td>
          {!onlyKeepPerson &&
            (ranking.attempts ? (
              <Solves event={event} attempts={ranking.attempts} showMultiPoints={!forRecordsTable} />
            ) : (
              ranking.memo && (
                <span>[{getFormattedTime(ranking.memo, { showDecimals: false, alwaysShowMinutes: true })}]</span>
              )
            ))}
        </td>
      )}
    </tr>
  );
};

export default RankingRow;
