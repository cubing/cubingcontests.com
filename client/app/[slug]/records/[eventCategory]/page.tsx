import omitBy from "lodash/omitBy";
import Link from "next/link";
import { Suspense } from "react";
import z from "zod";
import RecordsTable from "~/app/[slug]/records/[eventCategory]/RecordsTable.tsx";
import EventButtons from "~/app/components/EventButtons.tsx";
import RecordCategoriesButtonGroup from "~/app/components/RecordCategoriesButtonGroup.tsx";
import RegionSelect from "~/app/components/RegionSelect.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import Tabs from "~/app/components/UI/Tabs.tsx";
import { IS_CUBING_CONTESTS_INSTANCE } from "~/helpers/constants.ts";
import { eventCategories } from "~/helpers/event-categories.ts";
import type { NavigationItem } from "~/helpers/types/NavigationItem.ts";
import { type RecordCategory, RecordCategoryValues } from "~/helpers/types.ts";
import { slugPath } from "~/helpers/utility-functions.ts";
import {
  getEnabledRecordCategories,
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

  const organization = await getOrgDetails({ slug });
  const enabledRecordCategories = await getEnabledRecordCategories({ organizationId: organization!.id });
  const recordCategory: RecordCategory | "all" =
    category ??
    (IS_CUBING_CONTESTS_INSTANCE && eventCategory === "extreme-bld" ? "online" : enabledRecordCategories[0]);

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

          <RecordCategoriesButtonGroup
            pathTemplate={slugPath(
              slug,
              `/records/${eventCategory}?${
                urlSearchParamsWithoutCategory.toString() ? `${urlSearchParamsWithoutCategory}&` : ""
              }category=__CATEGORY__`,
            )}
            selectedCategory={recordCategory}
            recordCategories={enabledRecordCategories}
          />
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
