import Link from "next/link";
import { ssrFetch } from "~/helpers/DELETEfetchUtils";
import RankingsTable from "~/app/components/RankingsTable.tsx";
import EventButtons from "~/app/components/EventButtons.tsx";
import EventTitle from "~/app/components/EventTitle.tsx";
import { C } from "~/helpers/constants.ts";
import DonateAlert from "~/app/components/DonateAlert.tsx";
import RegionSelect from "~/app/rankings/[eventId]/[singleOrAvg]/RegionSelect.tsx";
import omitBy from "lodash/omitBy";
import { EventResponse } from "~/server/db/schema/events.ts";

// SEO
export const metadata = {
  title: "Rankings | Cubing Contests",
  description: "Rankings for unofficial Rubik's Cube competitions and speedcuber meetups.",
  keywords:
    "rankings rubik's rubiks cube contest contests competition competitions meetup meetups speedcubing speed cubing puzzle",
  icons: { icon: "/favicon.png" },
  metadataBase: new URL("https://cubingcontests.com"),
  openGraph: { images: ["/api2/static/cubing_contests_4.jpg"] },
};

type Props = {
  params: Promise<{ eventId: string; singleOrAvg: "single" | "average" }>;
  searchParams: Promise<{ show: "results"; region: string; topN: string }>;
};

async function RankingsPage({ params, searchParams }: Props) {
  const { eventId, singleOrAvg } = await params;
  const { show, region, topN } = await searchParams;
  const urlSearchParams = new URLSearchParams(omitBy({ show, region, topN }, (val) => !val));
  const queryString = urlSearchParams.toString() ? `?${urlSearchParams}` : "";
  urlSearchParams.delete("show");
  const queryStringWithoutShow = urlSearchParams.toString() ? `?${urlSearchParams}` : "";

  // Refreshes rankings every 5 minutes
  const eventRankingsResponse = await ssrFetch<IEventRankings>(
    `/results/rankings/${eventId}/${singleOrAvg}${queryString}`,
    { revalidate: C.rankingsRev },
  );
  const eventsResponse = await ssrFetch<EventResponse[]>("/events", { revalidate: C.rankingsRev });

  const currEvent = eventsResponse.success ? eventsResponse.data.find((e) => e.eventId === eventId) : undefined;

  if (!eventRankingsResponse.success || !eventsResponse.success || !currEvent) {
    return <p className="mt-5 text-center fs-4">Event not found</p>;
  }

  return (
    <div>
      <h2 className="mb-3 text-center">Rankings</h2>

      <DonateAlert />

      <div className="mb-3 px-2">
        <h4>Event</h4>
        <EventButtons eventId={eventId} events={eventsResponse.data} forPage="rankings" />

        <div className="d-flex flex-wrap gap-3 mb-4">
          <RegionSelect />

          <div className="d-flex flex-wrap gap-3">
            <div>
              <h5>Type</h5>
              <div className="btn-group btn-group-sm mt-2" role="group" aria-label="Type">
                <Link
                  href={`/rankings/${eventId}/single${queryString}`}
                  prefetch={false}
                  className={"btn btn-primary" + (singleOrAvg === "single" ? " active" : "")}
                >
                  Single
                </Link>
                <Link
                  href={`/rankings/${eventId}/average${queryString}`}
                  prefetch={false}
                  className={"btn btn-primary" + (singleOrAvg === "average" ? " active" : "")}
                >
                  {currEvent.defaultRoundFormat === "a" ? "Average" : "Mean"}
                </Link>
              </div>
            </div>

            <div>
              <h5>Show</h5>
              <div className="btn-group btn-group-sm mt-2" role="group" aria-label="Type">
                <Link
                  href={`/rankings/${eventId}/${singleOrAvg}${queryStringWithoutShow}`}
                  prefetch={false}
                  className={"btn btn-primary" + (!show ? " active" : "")}
                >
                  Top Persons
                </Link>
                <Link
                  href={`/rankings/${eventId}/${singleOrAvg}${
                    queryStringWithoutShow ? `${queryStringWithoutShow}&` : "?"
                  }show=results`}
                  prefetch={false}
                  className={"btn btn-primary" + (show ? " active" : "")}
                >
                  Top Results
                </Link>
              </div>
            </div>
          </div>
        </div>

        {(currEvent.category === "extreme-bld" || currEvent.submissionsAllowed) && (
          <Link href={`/user/submit-results?eventId=${eventId}`} className="btn btn-success btn-sm">
            Submit a result
          </Link>
        )}
      </div>

      <EventTitle event={currEvent} showDescription />

      <RankingsTable
        rankings={eventRankingsResponse.data.rankings}
        event={eventRankingsResponse.data.event}
        topResultsRankings={show === "results"}
      />
    </div>
  );
}

export default RankingsPage;
