import Link from 'next/link';
import '@cubing/icons';
import myFetch from '~/helpers/myFetch';
import Solves from '~/app/components/Solves';
import Competitor from '~/app/components/Competitor';
import RecordsCategoryTabs from '~/app/components/RecordsCategoryTabs';
import RankingsTable from '~/app/components/RankingsTable';
import { IEventRankings } from '@sh/interfaces';
import { getFormattedTime, getFormattedDate } from '~/helpers/utilityFunctions';
import { eventCategories } from '~/helpers/eventCategories';
import { EventGroup } from '~/shared_helpers/enums';
import EventTitle from '~/app/components/EventTitle';

// SEO
export const metadata = {
  title: 'Records | Cubing Contests',
  description: "Records from unofficial Rubik's Cube competitions and speedcuber meetups.",
  keywords:
    "records rankings rubik's rubiks cube contest contests competition competitions meetup meetups speedcubing speed cubing puzzle",
  icons: { icon: '/favicon.png' },
  metadataBase: new URL('https://cubingcontests.com'),
  openGraph: {
    images: ['/api/cubing_contests_3.jpg'],
  },
};

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
              return (
                <div key={event.eventId} className="mb-3">
                  <EventTitle event={event} showIcon linkToRankings />

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
                              <Competitor key={person.personId} person={person} />
                            ))}
                          </div>
                          {type !== 'single' && <Solves event={event} attempts={result.attempts} />}
                          {(result.videoLink || result.discussionLink) && (
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
                    <RankingsTable rankings={rankings} event={event} recordsTable />
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
