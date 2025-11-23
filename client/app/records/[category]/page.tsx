import capitalize from "lodash/capitalize";
import Link from "next/link";
import AffiliateLink from "~/app/components/AffiliateLink.tsx";
import Competitors from "~/app/components/Competitors.tsx";
import EventTitle from "~/app/components/EventTitle.tsx";
import RankingLinks from "~/app/components/RankingLinks.tsx";
import RankingsTable from "~/app/components/RankingsTable.tsx";
import Solves from "~/app/components/Solves.tsx";
import Tabs from "~/app/components/UI/Tabs.tsx";
import { C } from "~/helpers/constants.ts";
import { ssrFetch } from "~/helpers/DELETEfetchUtils.ts";
import { eventCategories } from "~/helpers/eventCategories.ts";
import { getFormattedTime } from "~/helpers/sharedFunctions.ts";
import type { NavigationItem } from "~/helpers/types/NavigationItem.ts";
import type { EventCategory, ResultRankingType } from "~/helpers/types.ts";
import { getFormattedDate } from "~/helpers/utilityFunctions.ts";

// SEO
export const metadata = {
  title: "Records | Cubing Contests",
  description: "Records from unofficial Rubik's Cube competitions and speedcuber meetups.",
  keywords:
    "records rankings rubik's rubiks cube contest contests competition competitions meetup meetups speedcubing speed cubing puzzle",
  icons: { icon: "/favicon.png" },
  metadataBase: new URL("https://cubingcontests.com"),
  openGraph: {
    images: ["/banners/cubing_contests_3.jpg"],
  },
};

type Props = {
  params: Promise<{ category: string }>;
};

const RecordsPage = async ({ params }: Props) => {
  const { category } = await params;
  const recordsByEventResponse = await ssrFetch<IEventRankings[]>("/results/records/WR", { revalidate: C.rankingsRev });

  if (!recordsByEventResponse.success) return <p className="fs-4 mt-5 text-center">Records not found</p>;

  // Gets just the events for the current records category
  const filteredEventRecords = recordsByEventResponse.data.filter((er) =>
    er.event.groups.includes((eventCategories.find((ec) => ec.value === category) as EventCategory).group),
  );
  const selectedCat = eventCategories.find((ec) => ec.value === category) as EventCategory;
  const tabs: NavigationItem[] = eventCategories.map((cat) => ({
    title: cat.title,
    shortTitle: cat.shortTitle,
    value: cat.value,
    route: `/records/${cat.value}`,
    hidden: !recordsByEventResponse.data.some((er) => er.event.groups.includes(cat.group)),
  }));

  return (
    <div>
      <h2 className="mb-4 text-center">Records</h2>

      <AffiliateLink type={category === "unofficial" ? "fto" : category === "wca" ? "wca" : "other"} />

      {recordsByEventResponse.data.length === 0 ? (
        <p className="fs-5 mx-2">No records have been set yet</p>
      ) : (
        <>
          <Tabs tabs={tabs} activeTab={category} forServerSidePage />

          {selectedCat.description && <p className="mx-2">{selectedCat.description}</p>}

          {category === "extremebld" && (
            <Link href={"/user/submit-results"} className="btn btn-success btn ms-2">
              Submit a result
            </Link>
          )}

          <div className="mt-4">
            {filteredEventRecords.map(({ event, rankings }: IEventRankings) => {
              return (
                <div key={event.eventId} className="mb-3">
                  <EventTitle event={event} showIcon linkToRankings showDescription />

                  {/* MOBILE VIEW */}
                  <div className="d-lg-none mt-2 mb-4 border-bottom border-top">
                    <ul className="list-group list-group-flush">
                      {rankings.map((r) => (
                        <li
                          key={r.type + r.resultId}
                          className="d-flex flex-column list-group-item list-group-item-secondary gap-2 py-3"
                        >
                          <div className="d-flex justify-content-between">
                            <span>
                              <b>{getFormattedTime(r.result, { event })}</b>
                              &#8194;{capitalize(r.type as ResultRankingType)}
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

                  {/* DESKTOP VIEW */}
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
};

export default RecordsPage;
