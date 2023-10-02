import myFetch from '~/helpers/myFetch';
import Link from 'next/link';
import RankingsTable from '~/app/components/RankingsTable';
import EventButtons from '~/app/components/EventButtons';
import EventTitle from '~/app/components/EventTitle';
import { IEvent, IEventRankings } from '@sh/interfaces';
import { EventGroup, RoundFormat } from '@sh/enums';
import C from '@sh/constants';

// SEO
export const metadata = {
  title: 'Rankings | Cubing Contests',
  description: "Rankings for unofficial Rubik's Cube competitions and speedcuber meetups.",
  keywords:
    "rankings rubik's rubiks cube contest contests competition competitions meetup meetups speedcubing speed cubing puzzle",
  icons: { icon: '/favicon.png' },
  metadataBase: new URL('https://cubingcontests.com'),
  openGraph: {
    images: ['/api/cubing_contests_4.jpg'],
  },
};

const RankingsPage = async ({
  params: { eventId, singleOrAvg },
  searchParams,
}: {
  params: { eventId: string; singleOrAvg: 'single' | 'average' };
  searchParams: { show: 'results' };
}) => {
  // Refreshes rankings every 5 minutes
  const { payload: eventRankings }: { payload?: IEventRankings } = await myFetch.get(
    `/results/rankings/${eventId}/${singleOrAvg}${searchParams.show ? '?show=results' : ''}`,
    { revalidate: C.rankingsRevalidate },
  );
  const { payload: events }: { payload?: IEvent[] } = await myFetch.get('/events');

  const currEvent = events?.find((el) => el.eventId === eventId);

  if (eventRankings && events && currEvent) {
    return (
      <div>
        <h2 className="mb-3 text-center">Rankings</h2>

        <div className="mb-3 px-2">
          <h4>Event</h4>
          <EventButtons events={events} activeEvent={currEvent} singleOrAvg={singleOrAvg} showCategories />

          <div className="d-flex flex-wrap gap-3 mb-4">
            <div>
              <h4>Type</h4>
              <div className="btn-group btn-group-sm mt-2" role="group" aria-label="Type">
                <Link
                  href={`/rankings/${eventId}/single${searchParams.show ? '?show=results' : ''}`}
                  className={'btn btn-primary' + (singleOrAvg === 'single' ? ' active' : '')}
                >
                  Single
                </Link>
                <Link
                  href={`/rankings/${eventId}/average${searchParams.show ? '?show=results' : ''}`}
                  className={'btn btn-primary' + (singleOrAvg === 'average' ? ' active' : '')}
                >
                  {currEvent.defaultRoundFormat === RoundFormat.Average ? 'Average' : 'Mean'}
                </Link>
              </div>
            </div>

            <div>
              <h4>Show</h4>
              <div className="btn-group btn-group-sm mt-2" role="group" aria-label="Type">
                <Link
                  href={`/rankings/${eventId}/${singleOrAvg}`}
                  className={'btn btn-primary' + (!searchParams.show ? ' active' : '')}
                >
                  Top Persons
                </Link>
                <Link
                  href={`/rankings/${eventId}/${singleOrAvg}?show=results`}
                  className={'btn btn-primary' + (searchParams.show ? ' active' : '')}
                >
                  Top Results
                </Link>
              </div>
            </div>
          </div>

          {currEvent.groups.some((g) => [EventGroup.SubmissionsAllowed, EventGroup.ExtremeBLD].includes(g)) && (
            <Link href={`/user/submit-results?eventId=${eventId}`} className="btn btn-success btn-sm">
              Submit a result
            </Link>
          )}
        </div>

        <EventTitle event={currEvent} showDescription />

        <RankingsTable
          rankings={eventRankings.rankings}
          event={eventRankings.event}
          forAverage={singleOrAvg === 'average'}
          topResultsRankings={!!searchParams.show}
        />
      </div>
    );
  }

  return <p className="mt-5 text-center fs-4">Event not found</p>;
};

export default RankingsPage;
