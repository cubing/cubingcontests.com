import Link from 'next/link';
import Country from './Country';
import PersonName from './PersonName';
import Solves from './Solves';
import { getFormattedDate, getFormattedTime } from '~/helpers/utilityFunctions';
import { IEvent, IRanking } from '@sh/interfaces';

const RankingsTable = ({
  rankings,
  event,
  recordsTable = false,
  hideCompetitionColumn = false,
  hideSolvesColumn = false,
  hideLinksColumn,
}: {
  rankings: IRanking[];
  event: IEvent;
  recordsTable?: boolean;
  hideCompetitionColumn?: boolean;
  hideSolvesColumn?: boolean;
  hideLinksColumn: boolean;
}) => {
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
            {!hideCompetitionColumn && <th>Competition</th>}
            {!hideSolvesColumn && <th>Solves</th>}
            {!hideLinksColumn && <th>Links</th>}
          </tr>
        </thead>
        <tbody>
          {rankings.map(({ type, result, competition, persons }: IRanking) => {
            let tiedRanking = false;

            if (result.ranking === lastRanking) tiedRanking = true;
            else lastRanking = result.ranking;

            return persons.map((person, i) => (
              <tr key={type + (result as any)._id + person.personId}>
                <td>
                  {!i &&
                    (recordsTable ? (
                      getRecordType(type)
                    ) : (
                      <span className={tiedRanking ? 'text-secondary' : ''}>{result.ranking}</span>
                    ))}
                </td>
                <td>
                  <PersonName person={person} />
                </td>
                <td>{!i && getFormattedTime(type === 'single' ? result.best : result.average, event.format)}</td>
                <td>
                  <Country countryIso2={person.countryIso2} />
                </td>
                <td>{!i && getFormattedDate(result.date)}</td>
                {!hideCompetitionColumn && (
                  <td>
                    {!i && competition && (
                      <Link href={`/competitions/${competition.competitionId}`}>{competition.name}</Link>
                    )}
                  </td>
                )}
                {!hideSolvesColumn && <td>{!i && <Solves event={event} attempts={result.attempts} />}</td>}
                {!hideLinksColumn && (
                  <td>
                    {!i && (
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
            ));
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RankingsTable;
