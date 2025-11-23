import omitBy from "lodash/omitBy";
import Link from "next/link";
import AffiliateLink from "~/app/components/AffiliateLink.tsx";
import EventButtons from "~/app/components/EventButtons.tsx";
import EventTitle from "~/app/components/EventTitle.tsx";
import RankingsTable from "~/app/components/RankingsTable.tsx";
import RegionSelect from "~/app/rankings/[eventId]/[singleOrAvg]/RegionSelect.tsx";
import { C } from "~/helpers/constants.ts";
import { ssrFetch } from "~/helpers/DELETEfetchUtils.ts";

// SEO
export const metadata = {
  title: "Rankings | Cubing Contests",
  description: "Rankings for unofficial Rubik's Cube competitions and speedcuber meetups.",
  keywords:
    "rankings rubik's rubiks cube contest contests competition competitions meetup meetups speedcubing speed cubing puzzle",
  icons: { icon: "/favicon.png" },
  metadataBase: new URL("https://cubingcontests.com"),
  openGraph: { images: ["/banners/cubing_contests_4.jpg"] },
};

type Props = {
  params: Promise<{
    eventId: string;
    singleOrAvg: "single" | "average";
  }>;
  searchParams: Promise<{
    show?: "results";
    contestType?: "all";
    region?: string;
    topN?: string;
  }>;
};

async function RankingsPage({ params, searchParams }: Props) {
  const { eventId, singleOrAvg } = await params;
  const { show, contestType, region, topN } = await searchParams;

  const urlSearchParams = new URLSearchParams(omitBy({ show, contestType, region, topN }, (val) => !val));
  const urlSearchParamsWithoutShow = new URLSearchParams(omitBy({ contestType, region, topN }, (val) => !val));
  const urlSearchParamsWithoutContestType = new URLSearchParams(omitBy({ show, region, topN }, (val) => !val));
  const urlSearchParamsWithoutTopN = new URLSearchParams(omitBy({ show, contestType, region }, (val) => !val));

  // Refreshes rankings every 5 minutes
  const eventRankingsResponse = await ssrFetch<IEventRankings>(
    `/results/rankings/${eventId}/${singleOrAvg}?${urlSearchParams}`,
    { revalidate: C.rankingsRev },
  );
  const eventsResponse = await ssrFetch<EventResponse[]>("/events", { revalidate: C.rankingsRev });

  const currEvent = eventsResponse.success ? eventsResponse.data.find((e) => e.eventId === eventId) : undefined;

  if (!eventRankingsResponse.success) {
    return <h3 className="mt-5 text-center">Error while loading rankings</h3>;
  }

  if (!eventsResponse.success || !currEvent) {
    return <p className="fs-4 mt-5 text-center">Event not found</p>;
  }

  const affiliateLinkType =
    /^333bf_[0-9]*_person_relay$/.test(currEvent.eventId) ||
    [
      "333",
      "333oh",
      "333bf",
      "333fm",
      "333mbf",
      "333_oh_bld_team_relay",
      "333_team_bld",
      "333_team_bld_old",
      "333_linear_fm",
      "333_speed_bld",
      "333mts",
      "333ft",
      "333mbo",
      "333_team_factory",
      "333_one_move_team_factory",
      "333_inspectionless",
      "333_scrambling",
      "333oh_x2",
      "333_oven_mitts",
      "333_doubles",
      "333_one_side",
      "333_supersolve",
      "333_cube_mile",
    ].includes(currEvent.eventId)
      ? "3x3"
      : ["222", "222bf", "222fm", "222oh"].includes(currEvent.eventId)
        ? "2x2"
        : currEvent.groups.includes(EventGroup.WCA)
          ? "wca"
          : ["fto", "fto_bld", "fto_mbld", "mfto", "baby_fto"].includes(currEvent.eventId)
            ? "fto"
            : ["333_mirror_blocks", "333_mirror_blocks_bld", "222_mirror_blocks"].includes(currEvent.eventId)
              ? "mirror"
              : currEvent.eventId === "kilominx"
                ? "kilominx"
                : "other";

  return (
    <div>
      <h2 className="mb-3 text-center">Rankings</h2>

      <AffiliateLink type={affiliateLinkType} />

      <div className="mb-3 px-2">
        <h4>Event</h4>
        <EventButtons eventId={eventId} events={eventsResponse.data} forPage="rankings" />

        <div className="d-flex mb-4 flex-wrap gap-3">
          <RegionSelect />

          <div className="d-flex flex-wrap gap-3">
            <div>
              <h5>Type</h5>
              <div className="btn-group btn-group-sm mt-2" role="group" aria-label="Type">
                <Link
                  href={`/rankings/${eventId}/single?${urlSearchParams}`}
                  prefetch={false}
                  className={"btn btn-primary" + (singleOrAvg === "single" ? "active" : "")}
                >
                  Single
                </Link>
                <Link
                  href={`/rankings/${eventId}/average?${urlSearchParams}`}
                  prefetch={false}
                  className={"btn btn-primary" + (singleOrAvg === "average" ? "active" : "")}
                >
                  {currEvent.defaultRoundFormat === "a" ? "Average" : "Mean"}
                </Link>
              </div>
            </div>

            <div>
              <h5>Show</h5>
              <div className="btn-group btn-group-sm mt-2" role="group" aria-label="Show">
                <Link
                  href={`/rankings/${eventId}/${singleOrAvg}?${urlSearchParamsWithoutShow}`}
                  prefetch={false}
                  className={"btn btn-primary" + (!show ? "active" : "")}
                >
                  Top Persons
                </Link>
                <Link
                  href={`/rankings/${eventId}/${singleOrAvg}?${
                    urlSearchParamsWithoutShow.toString() ? `${urlSearchParamsWithoutShow}&` : ""
                  }show=results`}
                  prefetch={false}
                  className={"btn btn-primary" + (show ? "active" : "")}
                >
                  Top Results
                </Link>
              </div>
            </div>

            <div>
              <h5>Top</h5>
              <div className="btn-group btn-group-sm mt-2" role="group" aria-label="Top">
                <Link
                  href={`/rankings/${eventId}/${singleOrAvg}?${urlSearchParamsWithoutTopN}`}
                  prefetch={false}
                  className={"btn btn-primary" + (!topN || topN === "100" ? "active" : "")}
                >
                  100
                </Link>
                <Link
                  href={`/rankings/${eventId}/${singleOrAvg}?${
                    urlSearchParamsWithoutTopN.toString() ? `${urlSearchParamsWithoutTopN}&` : ""
                  }topN=1000`}
                  prefetch={false}
                  className={"btn btn-primary" + (topN === "1000" ? "active" : "")}
                >
                  1000
                </Link>
                <Link
                  href={`/rankings/${eventId}/${singleOrAvg}?${
                    urlSearchParamsWithoutTopN.toString() ? `${urlSearchParamsWithoutTopN}&` : ""
                  }topN=10000`}
                  prefetch={false}
                  className={"btn btn-primary" + (topN === "10000" ? "active" : "")}
                >
                  10000
                </Link>
              </div>
            </div>

            {!currEvent.groups.some((g) => [EventGroup.WCA, EventGroup.ExtremeBLD].includes(g)) && (
              <div>
                <h5>Contest Type</h5>
                <div className="btn-group btn-group-sm mt-2" role="group" aria-label="Contest Type">
                  <Link
                    href={`/rankings/${eventId}/${singleOrAvg}?${urlSearchParamsWithoutContestType}`}
                    prefetch={false}
                    className={"btn btn-primary" + (!contestType ? "active" : "")}
                  >
                    Competitions
                  </Link>
                  <Link
                    href={`/rankings/${eventId}/${singleOrAvg}?${
                      urlSearchParamsWithoutContestType.toString() ? `${urlSearchParamsWithoutContestType}&` : ""
                    }contestType=all`}
                    prefetch={false}
                    className={"btn btn-primary" + (contestType ? "active" : "")}
                  >
                    All
                  </Link>
                </div>
              </div>
            )}
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
