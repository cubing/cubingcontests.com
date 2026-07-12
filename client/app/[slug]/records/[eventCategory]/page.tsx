import omitBy from "lodash/omitBy";
import Link from "next/link";
import { Suspense } from "react";
import z from "zod";
import RecordsTable from "~/app/[slug]/records/[eventCategory]/RecordsTable.tsx";
import EventButtons from "~/app/components/EventButtons.tsx";
import RegionSelect from "~/app/components/RegionSelect.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import Tabs from "~/app/components/UI/Tabs.tsx";
import { eventCategories } from "~/helpers/event-categories.ts";
import type { NavigationItem } from "~/helpers/types/NavigationItem.ts";
import { RecordCategoryValues } from "~/helpers/types.ts";
import { slugPath } from "~/helpers/utility-functions.ts";
import {
  getEvents,
  getOrgDetails,
  getRecords,
  getRegions,
} from "~/server/server-only-functions/server-only-functions.ts";

export const metadata = {
  title: "Records",
  description: process.env.METADATA_RECORDS_DESCRIPTION,
  openGraph: {
    images: [`${process.env.NEXT_PUBLIC_STORAGE_PUBLIC_BUCKET_BASE_URL}/assets/screenshots/records.jpg`],
  },
};

const ParamsValidator = z.strictObject({
  slug: z.string().nonempty(),
  eventCategory: z.string().nonempty(),
});
const SearchParamsValidator = z.strictObject({
  category: z.enum(RecordCategoryValues).nullable().optional(),
  eventId: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
});

type Props = {
  params: Promise<z.infer<typeof ParamsValidator>>;
  searchParams: Promise<z.infer<typeof SearchParamsValidator>>;
};

async function RecordsPage({ params, searchParams }: Props) {
  const { slug, eventCategory } = ParamsValidator.parse(await params);
  const { category, eventId, region } = SearchParamsValidator.parse(await searchParams);

  const urlSearchParams = new URLSearchParams(omitBy({ category, eventId, region } as any, (val) => !val));
  const urlSearchParamsWithoutCategory = new URLSearchParams(omitBy({ eventId, region } as any, (val) => !val));

  const recordCategory = category ?? (eventCategory === "extreme-bld" ? "online" : "competitions");

  const organization = await getOrgDetails({ slug });
  const recordsPromise = getRecords({
    organizationId: organization!.id,
    eventCategory,
    recordCategory,
    eventId: eventId ?? undefined,
    regionCode: region ?? undefined,
  });

  const [events, regions] = await Promise.all([
    getEvents({ organizationId: organization.id }),
    getRegions(organization.id),
  ]);

  const selectedCat = eventCategories.find((ec) => ec.value === eventCategory)!;
  const tabs: NavigationItem[] = eventCategories
    // Only show categories that have at least one event
    .filter((ec) => events.some((e) => e.category === ec.value))
    .map((ec) => ({
      title: ec.title,
      shortTitle: ec.shortTitle,
      value: ec.value,
      route: slugPath(slug, `/records/${ec.value}?${urlSearchParams}`),
      hidden: ec.value === "removed",
    }));
  const selectedCatEvents = events.filter((e) => e.category === eventCategory);

  return (
    <section>
      <h2 className="mb-4 text-center">Records</h2>

      <Tabs tabs={tabs} activeTab={eventCategory} forServerSidePage />

      <div className="px-2">
        {selectedCat.description && <p>{selectedCat.description}</p>}

        <h4>Event</h4>
        <EventButtons events={selectedCatEvents} resetOnSameEventClick showAllEvents />

        {/* Similar code to the rankings page */}
        <div className="d-flex flex-wrap gap-3">
          <RegionSelect regions={regions} />

          <div>
            <h5>Category</h5>
            {/* biome-ignore lint/a11y/useSemanticElements: this is the most suitable way to make a button group */}
            <div className="btn-group btn-group-sm mt-2" role="group" aria-label="Contest Type">
              <Link
                href={slugPath(
                  slug,
                  `/records/${eventCategory}?${
                    urlSearchParamsWithoutCategory.toString() ? `${urlSearchParamsWithoutCategory}&` : ""
                  }category=competitions`,
                )}
                prefetch={false}
                className={`btn btn-primary ${recordCategory === "competitions" ? "active" : ""}`}
              >
                Competitions
              </Link>
              <Link
                href={slugPath(
                  slug,
                  `/records/${eventCategory}/?${
                    urlSearchParamsWithoutCategory.toString() ? `${urlSearchParamsWithoutCategory}&` : ""
                  }category=meetups`,
                )}
                prefetch={false}
                className={`btn btn-primary ${recordCategory === "meetups" ? "active" : ""}`}
              >
                Meetups
              </Link>
              <Link
                href={slugPath(
                  slug,
                  `/records/${eventCategory}?${
                    urlSearchParamsWithoutCategory.toString() ? `${urlSearchParamsWithoutCategory}&` : ""
                  }category=online`,
                )}
                prefetch={false}
                className={`btn btn-primary ${recordCategory === "online" ? "active" : ""}`}
              >
                Online
              </Link>
            </div>
          </div>
        </div>
      </div>

      {eventCategory === "extremebld" && (
        <Link
          href={slugPath(slug, "/video-based-results/submit")}
          prefetch={false}
          className="btn btn-success btn ms-2"
        >
          Submit a result
        </Link>
      )}

      <Suspense fallback={<Loading />}>
        <RecordsTable
          recordsPromise={recordsPromise}
          events={events.filter((e) => e.category === eventCategory)}
          regions={regions}
        />
      </Suspense>
    </section>
  );
}

export default RecordsPage;
