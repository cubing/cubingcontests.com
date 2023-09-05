import myFetch from '~/helpers/myFetch';
import RankingsTable from '~/app/components/RankingsTable';
import { IEvent, IEventRankings } from '@sh/interfaces';
import EventButtons from '~/app/components/EventButtons';
import Link from 'next/link';
import { RoundFormat } from '~/shared_helpers/enums';
import EventTitle from '~/app/components/EventTitle';

// SEO
export const metadata = {
  title: 'Rankings | Cubing Contests',
  description: "Rankings for unofficial Rubik's Cube competitions and speedcuber meetups.",
  keywords:
    "rankings rubik's rubiks cube contest contests competition competitions meetup meetups speedcubing speed cubing puzzle",
  icons: { icon: '/favicon.png' },
  metadataBase: new URL('https://cubingcontests.com'),
  openGraph: {
    images: ['/api/cubing_contests_1.jpg'],
  },
};

const Rankings = async ({
  params: { eventId, singleOrAvg },
}: {
  params: { eventId: string; singleOrAvg: 'single' | 'average' };
}) => {
  // Refreshes rankings every 5 minutes
  const { payload }: { payload?: IEventRankings } = await myFetch.get(`/results/rankings/${eventId}/${singleOrAvg}`, {
    revalidate: 300,
  });
  const { payload: events }: { payload?: IEvent[] } = await myFetch.get('/events');

  if (payload && events) {
    const currEvent = events.find((el) => el.eventId === eventId);

    return (
      <div>
        <h2 className="mb-3 text-center">Rankings</h2>

        <div className="mb-3 px-2">
          <h4>Event</h4>
          <EventButtons events={events} activeEvent={currEvent} singleOrAvg={singleOrAvg} />

          <div className="d-flex gap-3 mb-4">
            <div>
              <h4>Type</h4>
              <div className="btn-group btn-group-sm mt-2" role="group" aria-label="Type">
                <Link
                  href={`/rankings/${eventId}/single`}
                  className={'btn btn-primary' + (singleOrAvg === 'single' ? ' active' : '')}
                >
                  Single
                </Link>
                <Link
                  href={`/rankings/${eventId}/average`}
                  className={'btn btn-primary' + (singleOrAvg === 'average' ? ' active' : '')}
                >
                  {currEvent.defaultRoundFormat === RoundFormat.Average ? 'Average' : 'Mean'}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <EventTitle event={currEvent} />

        <RankingsTable rankings={payload.rankings} event={payload.event} forAverage={singleOrAvg === 'average'} />
      </div>
    );
  }

  return <p className="mt-5 text-center fs-4">Error while loading the page</p>;
};

export default Rankings;
