import RankingRow from './RankingRow';
import { IEvent, IRanking } from '@sh/interfaces';

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
  if (topResultsRankings && recordsTable) {
    throw new Error('forAverage and topResultsRankings cannot both be true in RankingsTable');
  }

  const hasComp = rankings.some((el) => el.competition);
  const hasLink = rankings.some((el) => el.result.videoLink || el.result.discussionLink);
  const showAllTeammates = event?.participants > 1 && topResultsRankings && !recordsTable;
  const showTeamColumn = event?.participants > 1 && !showAllTeammates && !recordsTable;
  const showSolves = rankings.some((el) => el.type !== 'single');
  let lastRanking = 0;

  // THIS IS A TEMPORARY SOLUTION UNTIL I18N IS ADDED. The records page has this same function too.
  const getRecordType = (type: 'single' | 'average' | 'mean'): string => {
    if (type === 'single') return 'Single';
    else if (type === 'average') return 'Average';
    else if (type === 'mean') return 'Mean';
  };

  if (rankings.length === 0) {
    return (
      <p className="mt-4 mx-2 fs-5">
        {forAverage ? 'There are no average results for this event yet' : 'There are no results for this event yet'}
      </p>
    );
  }

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
            {showSolves && <th>Solves</th>}
          </tr>
        </thead>
        <tbody>
          {rankings.map(({ type, result, competition, persons }: IRanking) => {
            let isTiedRanking = false;
            if (result.ranking === lastRanking) isTiedRanking = true;
            else lastRanking = result.ranking;

            if (recordsTable) {
              return persons.map((person, i) => (
                <RankingRow
                  key={`${type}_${(result as any)._id}_${person.personId}`}
                  firstColumnValue={getRecordType(type)}
                  isFirstRow={i === 0}
                  bestOrAvg={type === 'single' ? 'best' : 'average'}
                  result={result}
                  persons={[person]}
                  competition={competition}
                  event={event}
                  showAllTeammates={showAllTeammates}
                  showSolves={showSolves}
                  forRecordsTable
                />
              ));
            }

            let key = `${(result as any)._id}_${persons[0].personId}`;
            if ((result as any).attemptNumber !== undefined) key += `_${(result as any).attemptNumber}`;

            return (
              <RankingRow
                key={key}
                firstColumnValue={result.ranking}
                isFirstRow={!isTiedRanking}
                bestOrAvg={type === 'single' ? 'best' : 'average'}
                result={result}
                persons={persons}
                competition={competition}
                event={event}
                showAllTeammates={showAllTeammates}
                showTeamColumn={showTeamColumn}
                showSolves={showSolves}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RankingsTable;
