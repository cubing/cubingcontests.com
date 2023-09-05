import RankingRow from './RankingRow';
import { IEvent, IRanking } from '@sh/interfaces';

const RankingsTable = ({
  rankings,
  event,
  recordsTable = false,
}: {
  rankings: IRanking[];
  event: IEvent;
  recordsTable?: boolean;
}) => {
  const hasCompetition = rankings.some((el) => el.competition);
  const showTeammates = !recordsTable && event?.participants > 1;
  const showSolves = rankings.some((el) => el.type !== 'single');
  const hasLink = rankings.some((el) => el.result.videoLink || el.result.discussionLink);
  let lastRanking = 0;

  // THIS IS A TEMPORARY SOLUTION UNTIL I18N IS ADDED. The records page has this same function too.
  const getRecordType = (type: 'single' | 'average' | 'mean'): string => {
    if (type === 'single') return 'Single';
    else if (type === 'average') return 'Average';
    else if (type === 'mean') return 'Mean';
  };

  return (
    <div className="table-responsive flex-grow-1">
      <table className="table table-hover table-responsive text-nowrap">
        <thead>
          <tr>
            <th>{recordsTable ? 'Type' : '#'}</th>
            <th>Name</th>
            <th>Result</th>
            <th>Representing</th>
            <th>Date</th>
            {hasCompetition && <th>Competition</th>}
            {showTeammates && <th>{event.participants === 2 ? 'Teammate' : 'Teammates'}</th>}
            {showSolves && <th>Solves</th>}
            {hasLink && <th>Links</th>}
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
                  key={type + (result as any)._id + person.personId}
                  firstColumnValue={getRecordType(type)}
                  isFirstRow={i === 0}
                  bestOrAvg={type === 'single' ? 'best' : 'average'}
                  result={result}
                  persons={[person]}
                  competition={competition}
                  event={event}
                  showCompetitionColumn={hasCompetition}
                  showSolvesColumn={showSolves}
                  showLinksColumn={hasLink}
                  forRecordsTable
                />
              ));
            }

            return (
              <RankingRow
                key={(result as any)._id + persons[0].personId}
                firstColumnValue={result.ranking}
                isFirstRow={!isTiedRanking}
                bestOrAvg={type === 'single' ? 'best' : 'average'}
                result={result}
                persons={persons}
                competition={competition}
                event={event}
                showCompetitionColumn={hasCompetition}
                showSolvesColumn={showSolves}
                showLinksColumn={hasLink}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RankingsTable;
