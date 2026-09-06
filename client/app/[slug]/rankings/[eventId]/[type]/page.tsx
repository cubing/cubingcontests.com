import omitBy from "lodash/omitBy";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SWRConfig } from "swr";
import z from "zod";
import RankingsTable from "~/app/[slug]/rankings/[eventId]/[type]/RankingsTable.tsx";
import EventButtons from "~/app/components/EventButtons.tsx";
import EventTitle from "~/app/components/EventTitle.tsx";
import RecordCategoriesButtonGroup from "~/app/components/RecordCategoriesButtonGroup.tsx";
import RegionSelect from "~/app/components/RegionSelect.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import Tooltip from "~/app/components/UI/Tooltip.tsx";
import { IS_CUBING_CONTESTS_INSTANCE } from "~/helpers/constants.ts";
import { roundFormats } from "~/helpers/roundFormats.ts";
import { SwrKey } from "~/helpers/swr-keys.ts";
import { type RecordCategory, RecordCategoryValues } from "~/helpers/types.ts";
import { shortenEventName, slugPath } from "~/helpers/utility-functions.ts";
import { db } from "~/server/db/provider.ts";
import {
  getEnabledRecordCategories,
  getEventCategories,
  getEvents,
  getOrgDetails,
  getRankings,
  getRegions,
} from "~/server/server-only-functions/server-only-functions.ts";

const ParamsValidator = z.strictObject({
  slug: z.string().nonempty(),
  eventId: z.string().nonempty(),
  type: z.enum(["single", "average", "all-avg-formats"]),
});
const SearchParamsValidator = z.strictObject({
  show: z.literal("results").optional(),
  category: z.enum([...RecordCategoryValues, "all"]).optional(),
  region: z.string().nonempty().optional(),
  topN: z
    .string()
    .optional()
    .refine((val) => val === undefined || !Number.isNaN(Number(val)), { error: "Invalid topN number" })
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val)),
});

type Props = {
  params: Promise<z.infer<typeof ParamsValidator>>;
  searchParams: Promise<z.infer<typeof SearchParamsValidator>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, eventId, type } = await params;

  const event = await db.query.events.findFirst({
    columns: { name: true },
    where: { organization: { slug }, eventId },
  });

  return {
    title: `${shortenEventName(event?.name)} Rankings`,
    description: process.env.METADATA_RANKINGS_DESCRIPTION,
    openGraph: process.env.OG_IMAGES_URL
      ? { images: [`${process.env.OG_IMAGES_URL}/${slug}/rankings/${eventId}/${type}`] }
      : undefined,
  };
}

async function RankingsPage({ params, searchParams }: Props) {
  const parsedParams = ParamsValidator.safeParse(await params);
  const parsedSearchParams = SearchParamsValidator.safeParse(await searchParams);
  if (!parsedParams.success || !parsedSearchParams.success) return <LoadingError />;
  const { slug, eventId, type } = parsedParams.data;
  const { show, category, region, topN } = parsedSearchParams.data;

  const urlSearchParams = new URLSearchParams(omitBy({ show, category, region, topN } as any, (val) => !val));
  const urlSearchParamsWithoutShow = new URLSearchParams(omitBy({ category, region, topN } as any, (val) => !val));
  const urlSearchParamsWithoutCategory = new URLSearchParams(omitBy({ show, region, topN } as any, (val) => !val));
  const urlSearchParamsWithoutTopN = new URLSearchParams(omitBy({ show, category, region } as any, (val) => !val));

  const organization = await getOrgDetails({ slug });
  const [events, eventCategories, regions, enabledRecordCategories] = await Promise.all([
    getEvents({ organizationId: organization.id, includeHiddenAndRemoved: true }),
    getEventCategories({ organizationId: organization.id }),
    getRegions(organization.id),
    getEnabledRecordCategories({ organizationId: organization.id }),
  ]);

  const visibleEvents = events.filter((e) => !e.category.hidden && !e.hidden);
  const event = events.find((e) => e.eventId === eventId);
  if (!event) return <p className="fs-4 mx-3 mt-5 text-center">Event not found</p>;
  const eventCategory = eventCategories.find((ec) => ec.id === event.categoryId)!;
  const recordCategory: RecordCategory | "all" =
    category ??
    (eventCategory.videoBased ||
    (IS_CUBING_CONTESTS_INSTANCE &&
      ["wca", "miscellaneous"].includes(event.category.categoryId) &&
      event.submissionsAllowed)
      ? "online"
      : enabledRecordCategories[0]);
  const roundFormat = roundFormats.find((rf) => rf.value === event.defaultRoundFormat)!;

  const rankingsPromise = getRankings(organization!.id, event, type, recordCategory, { show, region, topN });

  return (
    <section>
      <h2 className="mb-3 text-center">Rankings</h2>

      <SWRConfig value={{ fallback: { [SwrKey.Regions]: regions } }}>
        <Suspense fallback={<Loading />}>
          <div className="mb-3 px-2">
            <h4>Event</h4>
            <EventButtons
              events={visibleEvents}
              eventCategories={eventCategories}
              eventIdOverride={eventId}
              pathTemplate={slugPath(slug, `/rankings/__EVENT_ID__/${type}`)}
            />

            {/* Similar code to the records page */}
            <div className="d-flex mb-4 flex-wrap gap-3">
              <RegionSelect />

              <div className="d-flex flex-wrap gap-3">
                <div>
                  <h5 className="d-flex mb-2 gap-1">
                    Type
                    {type === "all-avg-formats" && (
                      <Tooltip
                        id="type_tooltip"
                        text="Includes both Mo3 and Ao5 results, even if they don't match the ranked average format"
                      />
                    )}
                  </h5>
                  {/* biome-ignore lint/a11y/useSemanticElements: this is the most suitable way to make a button group */}
                  <div className="btn-group btn-group-sm" role="group" aria-label="Type">
                    <Link
                      href={slugPath(slug, `/rankings/${eventId}/single?${urlSearchParams}`)}
                      prefetch={false}
                      className={`btn btn-primary ${type === "single" ? "active" : ""}`}
                    >
                      Single
                    </Link>
                    <Link
                      href={slugPath(slug, `/rankings/${eventId}/average?${urlSearchParams}`)}
                      prefetch={false}
                      className={`btn btn-primary ${type === "average" ? "active" : ""}`}
                    >
                      {roundFormat.bestAndWorstAttemptsToExclude > 0 ? "Average" : "Mean"}
                    </Link>
                    <Link
                      href={slugPath(slug, `/rankings/${eventId}/all-avg-formats?${urlSearchParams}`)}
                      prefetch={false}
                      className={`btn btn-primary ${type === "all-avg-formats" ? "active" : ""}`}
                    >
                      All Avgs
                    </Link>
                  </div>
                </div>

                <div>
                  <h5 className="mb-2">Show</h5>
                  {/* biome-ignore lint/a11y/useSemanticElements: this is the most suitable way to make a button group */}
                  <div className="btn-group btn-group-sm" role="group" aria-label="Show">
                    <Link
                      href={slugPath(slug, `/rankings/${eventId}/${type}?${urlSearchParamsWithoutShow}`)}
                      prefetch={false}
                      className={`btn btn-primary ${!show ? "active" : ""}`}
                    >
                      Top Persons
                    </Link>
                    <Link
                      href={slugPath(
                        slug,
                        `/rankings/${eventId}/${type}?${
                          urlSearchParamsWithoutShow.toString() ? `${urlSearchParamsWithoutShow}&` : ""
                        }show=results`,
                      )}
                      prefetch={false}
                      className={`btn btn-primary ${show ? "active" : ""}`}
                    >
                      Top Results
                    </Link>
                  </div>
                </div>

                <div>
                  <h5 className="mb-2">Top</h5>
                  {/* biome-ignore lint/a11y/useSemanticElements: this is the most suitable way to make a button group */}
                  <div className="btn-group btn-group-sm" role="group" aria-label="Top">
                    <Link
                      href={slugPath(slug, `/rankings/${eventId}/${type}?${urlSearchParamsWithoutTopN}`)}
                      prefetch={false}
                      className={`btn btn-primary ${!topN || topN === 100 ? "active" : ""}`}
                    >
                      100
                    </Link>
                    <Link
                      href={slugPath(
                        slug,
                        `/rankings/${eventId}/${type}?${
                          urlSearchParamsWithoutTopN.toString() ? `${urlSearchParamsWithoutTopN}&` : ""
                        }topN=1000`,
                      )}
                      prefetch={false}
                      className={`btn btn-primary ${topN === 1000 ? "active" : ""}`}
                    >
                      1000
                    </Link>
                    <Link
                      href={slugPath(
                        slug,
                        `/rankings/${eventId}/${type}?${
                          urlSearchParamsWithoutTopN.toString() ? `${urlSearchParamsWithoutTopN}&` : ""
                        }topN=10000`,
                      )}
                      prefetch={false}
                      className={`btn btn-primary ${topN === 10000 ? "active" : ""}`}
                    >
                      10000
                    </Link>
                  </div>
                </div>

                <RecordCategoriesButtonGroup
                  pathTemplate={slugPath(
                    slug,
                    `/rankings/${eventId}/${type}?${
                      urlSearchParamsWithoutCategory.toString() ? `${urlSearchParamsWithoutCategory}&` : ""
                    }category=__CATEGORY__`,
                  )}
                  selectedCategory={recordCategory}
                  recordCategories={enabledRecordCategories}
                  allCategoriesOption
                />
              </div>
            </div>

            {(eventCategory.videoBased || event.submissionsAllowed) && (
              <Link
                href={slugPath(slug, `/video-based-results/submit?eventId=${eventId}`)}
                prefetch={false}
                className="btn btn-success btn-sm"
              >
                Submit a result
              </Link>
            )}
          </div>

          <EventTitle organizationSlug={slug} event={event} showDescription />

          {(eventCategory.hidden || event.hidden) && <p className="ms-2 text-danger">This is a hidden event</p>}
        </Suspense>

        <Suspense fallback={<Loading />}>
          <RankingsTable rankingsPromise={rankingsPromise} event={event} type={type} show={show} />
        </Suspense>
      </SWRConfig>
    </section>
  );
}

export default RankingsPage;
