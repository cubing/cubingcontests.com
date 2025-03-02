import Link from "next/link";
import capitalize from "lodash/capitalize";
import Tabs from "~/app/components/UI/Tabs.tsx";
import RankingsTable from "~/app/components/RankingsTable.tsx";
import RankingLinks from "~/app/components/RankingLinks.tsx";
import EventTitle from "~/app/components/EventTitle.tsx";
import Solves from "~/app/components/Solves.tsx";
import Competitors from "~/app/components/Competitors.tsx";
import { C } from "~/helpers/constants.ts";
import type { IEventRankings, ResultRankingType } from "~/helpers/types.ts";
import { getFormattedTime } from "~/helpers/sharedFunctions.ts";
import { getFormattedDate } from "~/helpers/utilityFunctions.ts";
import { eventCategories } from "~/helpers/eventCategories.ts";
import { type EventCategory, INavigationItem } from "~/helpers/types.ts";
import { ssrFetch } from "~/helpers/DELETEfetchUtils";

// SEO
export const metadata = {
  title: "Records | Cubing Contests",
  description:
    "Records from unofficial Rubik's Cube competitions and speedcuber meetups.",
  keywords:
    "records rankings rubik's rubiks cube contest contests competition competitions meetup meetups speedcubing speed cubing puzzle",
  icons: { icon: "/favicon.png" },
  metadataBase: new URL("https://cubingcontests.com"),
  openGraph: {
    images: ["/api2/static/cubing_contests_3.jpg"],
  },
};

type Props = {
  params: Promise<{ category: string }>;
};

const RecordsPage = async ({ params }: Props) => {
  const { category } = await params;
  const recordsByEventResponse = await ssrFetch<IEventRankings[]>(
    "/results/records/WR",
    { revalidate: C.rankingsRev },
  );

  if (!recordsByEventResponse.success) {
    return <p className="mt-5 text-center fs-4">Records not found</p>;
  }

  // Gets just the events for the current records category
  const filteredEventRecords = recordsByEventResponse.data.filter((er) =>
    er.event.groups.includes(
      (eventCategories.find((ec) => ec.value === category) as EventCategory)
        .group,
    )
  );
  const selectedCat = eventCategories.find((ec) =>
    ec.value === category
  ) as EventCategory;
  const tabs: INavigationItem[] = eventCategories.map((cat) => ({
    title: cat.title,
    shortTitle: cat.shortTitle,
    value: cat.value,
    route: `/records/${cat.value}`,
    hidden: !recordsByEventResponse.data.some((er) =>
      er.event.groups.includes(cat.group)
    ),
  }));

  return (
    <div>
      <h2 className="mb-4 text-center">Records</h2>

      {recordsByEventResponse.data.length === 0
        ? <p className="mx-2 fs-5">No records have been set yet</p>
        : (
          <>
            <Tabs tabs={tabs} activeTab={category} forServerSidePage />

            {selectedCat.description && (
              <p className="mx-2">{selectedCat.description}</p>
            )}

            {category === "extremebld" && (
              <Link
                href={"/user/submit-results"}
                className="btn btn-success btn ms-2"
              >
                Submit a result
              </Link>
            )}

            <div className="mt-4">
              {filteredEventRecords.map(
                ({ event, rankings }: IEventRankings) => {
                  return (
                    <div key={event.eventId} className="mb-3">
                      <EventTitle
                        event={event}
                        showIcon
                        linkToRankings
                        showDescription
                      />

                      {/* MOBILE VIEW */}
                      <div className="d-lg-none mt-2 mb-4 border-top border-bottom">
                        <ul className="list-group list-group-flush">
                          {rankings.map((r) => (
                            <li
                              key={r.type + r.resultId}
                              className="d-flex flex-column gap-2 py-3 list-group-item list-group-item-secondary"
                            >
                              <div className="d-flex justify-content-between">
                                <span>
                                  <b>{getFormattedTime(r.result, { event })}</b>
                                  &#8194;{capitalize(
                                    r.type as ResultRankingType,
                                  )}
                                </span>
                                {r.contest
                                  ? (
                                    <Link
                                      href={`/competitions/${r.contest.competitionId}`}
                                      prefetch={false}
                                    >
                                      {getFormattedDate(r.date)}
                                    </Link>
                                  )
                                  : <span>{getFormattedDate(r.date)}</span>}
                              </div>
                              <Competitors persons={r.persons} vertical />
                              {r.attempts && (
                                <Solves event={event} attempts={r.attempts} />
                              )}
                              {!r.contest && <RankingLinks ranking={r} />}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* DESKTOP VIEW */}
                      <div className="d-none d-lg-block">
                        <RankingsTable
                          rankings={rankings}
                          event={event}
                          recordsTable
                        />
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </>
        )}
    </div>
  );
};

export default RecordsPage;
