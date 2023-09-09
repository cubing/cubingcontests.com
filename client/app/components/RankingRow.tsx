'use client';

import { useState } from 'react';
import { FaCaretRight, FaCaretDown } from 'react-icons/fa';
import Country from './Country';
import Competitor from './Competitor';
import CompetitionName from '@c/CompetitionName';
import Solves from './Solves';
import { IEvent, IPerson, IRanking } from '@sh/interfaces';
import { getFormattedDate, getFormattedTime } from '~/helpers/utilityFunctions';

// THIS IS A TEMPORARY SOLUTION UNTIL I18N IS ADDED. The records page has this same function too.
const getRecordType = (type: 'single' | 'average' | 'mean'): string => {
  if (type === 'single') return 'Single';
  else if (type === 'average') return 'Average';
  else if (type === 'mean') return 'Mean';
};

const RankingRow = ({
  isFirstRow,
  event,
  ranking,
  person,
  showAllTeammates,
  showTeamColumn = false,
  showDetailsColumn,
  forRecordsTable = false,
}: {
  isFirstRow: boolean;
  event: IEvent;
  ranking: IRanking;
  person: IPerson; // the person being ranked
  showAllTeammates: boolean;
  showTeamColumn?: boolean;
  showDetailsColumn: boolean;
  forRecordsTable?: boolean;
}) => {
  const [teamExpanded, setTeamExpanded] = useState(false);

  // On the records page we only want the person and country to be shown, if
  const onlyKeepPerson = forRecordsTable && !isFirstRow;
  const firstColumnValue = ranking.ranking || getRecordType(ranking.type);
  const personsToDisplay = showAllTeammates ? ranking.persons : [person];

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
      <td>{!onlyKeepPerson && getFormattedTime(ranking.result, event.format)}</td>
      {!showAllTeammates && (
        <td>
          <Country countryIso2={person.countryIso2} />
        </td>
      )}
      <td>{!onlyKeepPerson && getFormattedDate(ranking.date)}</td>
      <td>
        {!onlyKeepPerson &&
          (ranking.competition ? (
            <CompetitionName competition={ranking.competition} />
          ) : (
            <div className="d-flex gap-2">
              {ranking.videoLink && (
                <a href={ranking.videoLink} target="_blank">
                  Video
                </a>
              )}
              {ranking.discussionLink && (
                <a href={ranking.discussionLink} target="_blank">
                  Discussion
                </a>
              )}
            </div>
          ))}
      </td>
      {showTeamColumn && (
        <td>
          {ranking.persons.length === 2 ? (
            <Competitor person={ranking.persons[1]} />
          ) : (
            <div className="d-flex flex-column align-items-start gap-2">
              {/* The style is necessary, because the icon is too tall, so it makes the whole row taller */}
              <span className="mb-2 text-white" style={{ height: '1.5rem', marginTop: '-4px' }}>
                <u style={{ cursor: 'pointer' }} onClick={() => setTeamExpanded(!teamExpanded)}>
                  {teamExpanded ? 'Collapse' : 'Expand'}
                </u>
                <span className="ms-1 fs-5">{teamExpanded ? <FaCaretDown /> : <FaCaretRight />}</span>
              </span>

              {teamExpanded && ranking.persons.map((p) => <Competitor key={p.personId} person={p} />)}
            </div>
          )}
        </td>
      )}
      {showDetailsColumn && (
        <td>
          {!onlyKeepPerson && (
            <>
              {ranking.attempts && <Solves event={event} attempts={ranking.attempts} />}
              {ranking.memo && <span>[{getFormattedTime(ranking.memo)}]</span>}
            </>
          )}
        </td>
      )}
    </tr>
  );
};

export default RankingRow;
