import RankingRow from './RankingRow';
import { IEvent, IRanking } from '@sh/types';

const RankingsTable = ({
  rankings,
  event,
  forAverage = false,
  recordsTable = false,
  topResultsRankings = false,
}: {
  rankings: IRanking[];
  event: IEvent;
  forAverage?: boolean;
  // These two parameters are mutually-exclusive
  recordsTable?: boolean;
  topResultsRankings?: boolean;
}) => {
  if (topResultsRankings && recordsTable)
    throw new Error('forAverage and topResultsRankings cannot both be true in RankingsTable');

  const hasComp = rankings.some((el) => el.contest);
  const hasLink = rankings.some((el) => el.videoLink || el.discussionLink);
  const showAllTeammates = event?.participants > 1 && topResultsRankings && !recordsTable;
  const showTeamColumn = event?.participants > 1 && !showAllTeammates && !recordsTable;
  const hasSolves = rankings.some((el) => el.attempts);
  const showDetailsColumn = hasSolves || rankings.some((el) => el.memo);
  let lastRanking = 0;

  if (rankings.length === 0) {
    return (
      <p className="mt-4 mx-2 fs-5">
        {forAverage ? 'There are no average results for this event yet' : 'There are no results for this event yet'}
      </p>
    );
  }

  /////////////////////////////////////////////////////////////////////////////////////////
  // REMEMBER TO UPDATE THE MOBILE VIEW OF THE RECORDS PAGE WHEN CHANGING THIS
  /////////////////////////////////////////////////////////////////////////////////////////

  return (
    <div className="table-responsive flex-grow-1">
      <table className="table table-hover table-responsive text-nowrap">
        <thead>
          <tr>
            <th>{recordsTable ? 'Type' : '#'}</th>
            <th>{!showAllTeammates ? 'Name' : 'Team'}</th>
            <th>Result</th>
            {!showAllTeammates && <th>Representing</th>}
            <th>Date</th>
            <th>
              {hasComp ? 'Competition' : ''}
              {hasComp && hasLink ? ' / ' : ''}
              {hasLink ? 'Links' : ''}
            </th>
            {showTeamColumn && <th>{event.participants === 2 ? 'Teammate' : 'Team'}</th>}
            {showDetailsColumn && <th>{hasSolves ? 'Solves' : 'Memorization time'}</th>}
          </tr>
        </thead>
        <tbody>
          {rankings.map((ranking) => {
            const isTiedRanking = ranking.ranking === lastRanking;
            lastRanking = ranking.ranking;

            if (recordsTable) {
              return ranking.persons.map((person, i) => (
                <RankingRow
                  key={`${ranking.type}_${ranking.resultId}_${person.personId}`}
                  onlyKeepPerson={i !== 0}
                  event={event}
                  ranking={ranking}
                  person={person}
                  showAllTeammates={showAllTeammates}
                  showDetailsColumn={showDetailsColumn}
                  forRecordsTable
                />
              ));
            }

            let key = `${ranking.resultId}_${ranking.persons[0].personId}`;
            if (ranking.attemptNumber !== undefined) key += `_${ranking.attemptNumber}`;

            return (
              <RankingRow
                key={key}
                isTiedRanking={isTiedRanking}
                event={event}
                ranking={ranking}
                // The backend sets the first person in the array as the person being ranked
                person={ranking.persons[0]}
                showAllTeammates={showAllTeammates}
                showTeamColumn={showTeamColumn}
                showDetailsColumn={showDetailsColumn}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RankingsTable;
