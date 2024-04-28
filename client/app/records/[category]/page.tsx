import Link from 'next/link';
import myFetch from '~/helpers/myFetch';
import Tabs from '@c/UI/Tabs';
import RankingsTable from '@c/RankingsTable';
import RankingLinks from '@c/RankingLinks';
import EventTitle from '@c/EventTitle';
import Solves from '@c/Solves';
import Competitors from '@c/Competitors';
import C from '@sh/constants';
import { IEventRankings } from '@sh/types';
import { getFormattedTime } from '@sh/sharedFunctions';
import { getFormattedDate } from '~/helpers/utilityFunctions';
import { eventCategories } from '~/helpers/eventCategories';
import { INavigationItem } from '~/helpers/interfaces/NavigationItem';

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

const RecordsPage = async ({ params }: { params: { category: string } }) => {
  // Refreshes records every 5 minutes
  const { payload: recordsByEvent }: { payload?: IEventRankings[] } = await myFetch.get('/results/records/WR', {
    revalidate: C.rankingsRev,
  });

  // Gets just the events for the current records category
  const filteredEventRecords = recordsByEvent?.filter((er) =>
    er.event.groups.includes(eventCategories.find((rc) => rc.value === params.category).group),
  );
  const selectedCat = eventCategories.find((el) => el.value === params.category);
  const tabs: INavigationItem[] = eventCategories.map((cat) => ({
    title: cat.title,
    shortTitle: cat.shortTitle,
    value: cat.value,
    route: `/records/${cat.value}`,
    hidden: !recordsByEvent?.some((el) => el.event.groups.includes(cat.group)),
  }));

  // THIS IS A TEMPORARY SOLUTION UNTIL I18N IS ADDED. RankingRow has this same function too.
  const getRecordType = (type: 'single' | 'average' | 'mean'): string => {
    return type[0].toUpperCase() + type.slice(1);
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
              <Link href={'/user/submit-results'} className="btn btn-success btn ms-2">
                Submit a result
              </Link>
            )}

            <div className="mt-4">
              {filteredEventRecords.map(({ event, rankings }: IEventRankings) => {
                return (
                  <div key={event.eventId} className="mb-3">
                    <EventTitle event={event} showIcon linkToRankings showDescription />

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
                                <Link href={`/competitions/${r.contest.competitionId}`} prefetch={false}>
                                  {getFormattedDate(r.date)}
                                </Link>
                              ) : (
                                <span>{getFormattedDate(r.date)}</span>
                              )}
                            </div>
                            <Competitors persons={r.persons} vertical />
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
