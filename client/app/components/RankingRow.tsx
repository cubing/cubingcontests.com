'use client';

import { useState } from 'react';
import { capitalize } from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import Country from '~/app/components/Country.tsx';
import Competitor from '~/app/components/Competitor.tsx';
import ContestName from '~/app/components/ContestName.tsx';
import Solves from '~/app/components/Solves.tsx';
import RankingLinks from '~/app/components/RankingLinks.tsx';
import Competitors from '~/app/components/Competitors.tsx';
import { IEvent, IPerson, IRanking, type ResultRankingType } from '~/shared_helpers/types.ts';
import { getFormattedTime } from '~/shared_helpers/sharedFunctions.ts';
import { getFormattedDate } from '~/helpers/utilityFunctions.ts';

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
  const firstColumnValue = ranking.ranking ?? capitalize(ranking.type as ResultRankingType);
  const personsToDisplay = showAllTeammates ? ranking.persons : [person];

  /////////////////////////////////////////////////////////////////////////////////////////
  // REMEMBER TO UPDATE THE MOBILE VIEW OF THE RECORDS PAGE IN ACCORDANCE WITH THIS
  /////////////////////////////////////////////////////////////////////////////////////////

  return (
    <tr>
      <td>
        {!onlyKeepPerson && <span className={isTiedRanking ? 'text-secondary' : ''}>{firstColumnValue}</span>}
      </td>
      <td>
        <Competitors persons={personsToDisplay} noFlag={!showAllTeammates} />
      </td>
      <td>
        {!onlyKeepPerson &&
          getFormattedTime(ranking.result, { event, showMultiPoints: !forRecordsTable })}
      </td>
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
          <div className='d-flex flex-column align-items-start gap-2 fs-6'>
            <span className='text-white'>
              <u
                style={{ cursor: 'pointer' }}
                onClick={() => setTeamExpanded(!teamExpanded)}
              >
                {teamExpanded ? 'Close' : 'Open'}
              </u>
              <span className='ms-2'>
                {teamExpanded ? <FontAwesomeIcon icon={faCaretDown} /> : <FontAwesomeIcon icon={faCaretRight} />}
              </span>
            </span>

            {teamExpanded &&
              ranking.persons.map((p) => <Competitor key={p.personId} person={p} />)}
          </div>
        </td>
      )}
      {showDetailsColumn && (
        <td>
          {!onlyKeepPerson &&
            (ranking.attempts
              ? (
                <Solves
                  event={event}
                  attempts={ranking.attempts}
                  showMultiPoints={!forRecordsTable}
                />
              )
              : (
                ranking.memo && (
                  <span>
                    [{getFormattedTime(ranking.memo, {
                      showDecimals: false,
                      alwaysShowMinutes: true,
                    })}]
                  </span>
                )
              ))}
        </td>
      )}
    </tr>
  );
};

export default RankingRow;
