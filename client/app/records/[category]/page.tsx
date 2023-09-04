import Link from 'next/link';
import myFetch from '~/helpers/myFetch';
import Country from '~/app/components/Country';
import Solves from '~/app/components/Solves';
import PersonName from '~/app/components/PersonName';
import RecordsCategoryTabs from '~/app/components/RecordsCategoryTabs';
import { IEventRankings } from '@sh/interfaces';
import { getFormattedTime, getFormattedDate } from '~/helpers/utilityFunctions';
import { eventCategories } from '~/helpers/eventCategories';
import RankingsTable from '~/app/components/RankingsTable';

const Records = async ({ params }: { params: { category: string } }) => {
  // Refreshes records every 5 minutes
  const { payload: recordsByEvent }: { payload?: IEventRankings[] } = await myFetch.get('/results/records/WR', {
    revalidate: 300,
  });

  // Gets just the events for the current records category
  const filteredEventRecords = recordsByEvent?.filter((er) =>
    er.event.groups.includes(eventCategories.find((rc) => rc.value === params.category).group),
  );

  // THIS IS A TEMPORARY SOLUTION UNTIL I18N IS ADDED. RankingsTable has this same function too.
  const getRecordType = (type: 'single' | 'average' | 'mean'): string => {
    if (type === 'single') return 'Single';
    else if (type === 'average') return 'Average';
    else if (type === 'mean') return 'Mean';
  };

  if (recordsByEvent) {
    return (
      <div>
        <h2 className="mb-4 text-center">Records</h2>

        {!recordsByEvent || recordsByEvent.length === 0 ? (
          <p className="mx-2 fs-5">No records have been set yet</p>
        ) : (
          <>
            <RecordsCategoryTabs recordsByEvent={recordsByEvent} category={params.category} />

            {filteredEventRecords.map(({ event, rankings }: IEventRankings) => {
              const showSolves = rankings.some((el) => el.result.attempts.length > 1);
              const hasCompetition = rankings.some((el) => el.competition);
              const hasLink = rankings.some((el) => el.result.videoLink || el.result.discussionLink);

              return (
                <div key={event.eventId} className="mb-3">
                  <h3 className="mx-2">{event.name}</h3>

                  <div className="d-block d-lg-none my-3 border-top border-bottom">
                    <ul className="list-group list-group-flush">
                      {rankings.map(({ type, result, competition, persons }) => (
                        <li
                          key={type + (result as any)._id}
                          className="d-flex flex-column gap-3 py-3 list-group-item list-group-item-dark"
                        >
                          <div className="d-flex justify-content-between">
                            <span>
                              <b>{getFormattedTime(type === 'single' ? result.best : result.average, event.format)}</b>
                              &#8194;{getRecordType(type)}
                            </span>
                            {competition ? (
                              <Link href={`/competitions/${competition.competitionId}`}>
                                {getFormattedDate(result.date)}
                              </Link>
                            ) : (
                              <span>{getFormattedDate(result.date)}</span>
                            )}
                          </div>
                          <div className="d-flex flex-column gap-2">
                            {persons.map((person) => (
                              <span key={person.personId} className="d-flex align-items-center gap-1">
                                <PersonName person={person} />
                                <Country countryIso2={person.countryIso2} noText />
                              </span>
                            ))}
                          </div>
                          {showSolves && <Solves event={event} attempts={result.attempts} />}
                          {hasLink && (
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
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="d-none d-lg-block">
                    <RankingsTable
                      rankings={rankings}
                      event={event}
                      recordsTable
                      hideCompetitionColumn={!hasCompetition}
                      hideSolvesColumn={!showSolves}
                      hideLinksColumn={!hasLink}
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    );
  }

  return <p className="mt-5 text-center fs-4">Error while loading the page</p>;
};

export default Records;
