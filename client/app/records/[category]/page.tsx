import Link from 'next/link';
import myFetch from '~/helpers/myFetch';
import Tabs from '~/app/components/Tabs';
import RankingsTable from '~/app/components/RankingsTable';
import RankingLinks from '~/app/components/RankingLinks';
import EventTitle from '~/app/components/EventTitle';
import Solves from '~/app/components/Solves';
import Competitor from '~/app/components/Competitor';
import { IEventRankings } from '@sh/interfaces';
import { getFormattedTime, getFormattedDate } from '~/helpers/utilityFunctions';
import { eventCategories } from '~/helpers/eventCategories';
import { EventGroup } from '~/shared_helpers/enums';

// SEO
export const metadata = {
  title: `Records | Cubing Contests`,
  description: `Records from unofficial Rubik's Cube competitions and speedcuber meetups.`,
  keywords: `records rankings rubik's rubiks cube contest contests competition competitions meetup meetups speedcubing speed cubing puzzle`,
  icons: { icon: `/favicon.png` },
  metadataBase: new URL(`https://cubingcontests.com`),
  openGraph: {
    images: [`/api/cubing_contests_3.jpg`],
  },
};

const RecordsPage = async ({ params }: { params: { category: string } }) => {
  // Refreshes records every 5 minutes
  const { payload: recordsByEvent }: { payload?: IEventRankings[] } = await myFetch.get(`/results/records/WR`, {
    revalidate: 300,
  });

  // Gets just the events for the current records category
  const filteredEventRecords = recordsByEvent?.filter((er) =>
    er.event.groups.includes(eventCategories.find((rc) => rc.value === params.category).group),
  );
  const selectedCat = eventCategories.find((el) => el.value === params.category);
  const tabs = eventCategories.map((cat) => ({
    title: cat.title,
    value: cat.value,
    route: `/records/${cat.value}`,
    hidden: cat.group === EventGroup.Removed || !recordsByEvent.some((el) => el.event.groups.includes(cat.group)),
  }));

  // THIS IS A TEMPORARY SOLUTION UNTIL I18N IS ADDED. RankingRow has this same function too.
  const getRecordType = (type: `single` | `average` | `mean`): string => {
    if (type === `single`) return `Single`;
    else if (type === `average`) return `Average`;
    else if (type === `mean`) return `Mean`;
  };

  if (recordsByEvent) {
    return (
      <div>
        <h2 className="mb-4 text-center">Records</h2>

        {!recordsByEvent || recordsByEvent.length === 0 ? (
          <p className="mx-2 fs-5">No records have been set yet</p>
        ) : (
          <>
            <Tabs tabs={tabs} activeTab={params.category} forServerSidePage />

            {selectedCat.description && <p className="mx-2">{selectedCat.description}</p>}

            {params.category === 'extremebld' && (
              <Link href={`/user/submit-results`} className="btn btn-success btn">
                Submit a result
              </Link>
            )}

            <div className="mt-4">
              {filteredEventRecords.map(({ event, rankings }: IEventRankings) => {
                return (
                  <div key={event.eventId} className="mb-3">
                    <EventTitle event={event} showIcon linkToRankings />

                    <div className="d-block d-lg-none mt-2 mb-4 border-top border-bottom">
                      <ul className="list-group list-group-flush">
                        {rankings.map((r) => (
                          <li
                            key={r.type + r.resultId}
                            className="d-flex flex-column gap-2 py-3 list-group-item list-group-item-dark"
                          >
                            <div className="d-flex justify-content-between">
                              <span>
                                <b>{getFormattedTime(r.result, { event })}</b>
                                &#8194;{getRecordType(r.type)}
                              </span>
                              {r.contest ? (
                                <Link href={`/competitions/${r.contest.competitionId}`}>
                                  {getFormattedDate(r.date)}
                                </Link>
                              ) : (
                                <span>{getFormattedDate(r.date)}</span>
                              )}
                            </div>
                            <div className="d-flex flex-column gap-2">
                              {r.persons.map((person) => (
                                <Competitor key={person.personId} person={person} />
                              ))}
                            </div>
                            {r.attempts && <Solves event={event} attempts={r.attempts} />}
                            {!r.contest && <RankingLinks ranking={r} />}
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
            </div>
          </>
        )}
      </div>
    );
  }

  return <p className="mt-5 text-center fs-4">Records not found</p>;
};

export default RecordsPage;
