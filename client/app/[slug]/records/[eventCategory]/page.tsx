import omitBy from "lodash/omitBy";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SWRConfig } from "swr";
import z from "zod";
import RecordsTable from "~/app/[slug]/records/[eventCategory]/RecordsTable.tsx";
import EventButtons from "~/app/components/EventButtons.tsx";
import RecordCategoriesButtonGroup from "~/app/components/RecordCategoriesButtonGroup.tsx";
import RegionSelect from "~/app/components/RegionSelect.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import Tabs from "~/app/components/UI/Tabs.tsx";
import { SwrKey } from "~/helpers/swr-keys.ts";
import type { NavigationItem } from "~/helpers/types/NavigationItem.ts";
import { type RecordCategory, RecordCategoryValues } from "~/helpers/types.ts";
import { slugPath } from "~/helpers/utility-functions.ts";
import {
  getEnabledRecordCategories,
  getEventCategories,
  getEvents,
  getOrgDetails,
  getRecords,
  getRegions,
} from "~/server/server-only-functions/server-only-functions.ts";

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, eventCategory } = await params;

  return {
    title: "Records",
    description: process.env.METADATA_RECORDS_DESCRIPTION,
    openGraph: process.env.OG_IMAGES_URL
      ? { images: [`${process.env.OG_IMAGES_URL}/${slug}/records/${eventCategory}`] }
      : undefined,
  };
}

async function RecordsPage({ params, searchParams }: Props) {
  const { slug, eventCategory } = ParamsValidator.parse(await params);
  const { category, eventId, region } = SearchParamsValidator.parse(await searchParams);

  const urlSearchParams = new URLSearchParams(omitBy({ category, eventId, region } as any, (val) => !val));
  const urlSearchParamsWithoutCategory = new URLSearchParams(omitBy({ eventId, region } as any, (val) => !val));

  const organization = await getOrgDetails({ slug });
  const [eventCategories, enabledRecordCategories] = await Promise.all([
    getEventCategories({ organizationId: organization.id }),
    getEnabledRecordCategories({ organizationId: organization.id }),
  ]);
  const selectedCat = eventCategories.find((ec) => ec.categoryId === eventCategory)!;
  const recordCategory: RecordCategory | "all" =
    category ?? (selectedCat.videoBased ? "online" : enabledRecordCategories[0]);

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

  const tabs: NavigationItem[] = eventCategories
    // Only show categories that have at least one event
    .filter((ec) => !ec.hidden && events.some((e) => e.categoryId === ec.id))
    .map((ec) => ({
      title: ec.name,
      shortTitle: ec.shortName ?? undefined,
      value: ec.categoryId,
      route: slugPath(slug, `/records/${ec.categoryId}?${urlSearchParams}`),
    }));
  const selectedCatEvents = events.filter((e) => e.categoryId === selectedCat.id);

  return (
    <SWRConfig value={{ fallback: { [SwrKey.Regions]: regions } }}>
      <section>
        <h2 className="mb-4 text-center">Records</h2>

        <Tabs tabs={tabs} activeTab={eventCategory} forServerSidePage />

        <Suspense fallback={<Loading />}>
          <div className="px-2">
            {selectedCat.description && <p>{selectedCat.description}</p>}

            <h4>Event</h4>
            <EventButtons
              events={selectedCatEvents}
              eventCategories={eventCategories}
              resetOnSameEventClick
              showAllEvents
            />

            {/* Similar code to the rankings page */}
            <div className="d-flex flex-wrap gap-3">
              <RegionSelect />

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

          {selectedCat.videoBased && (
            <Link
              href={slugPath(slug, "/video-based-results/submit")}
              prefetch={false}
              className="btn btn-success btn ms-2"
            >
              Submit a result
            </Link>
          )}
        </Suspense>

        <Suspense fallback={<Loading />}>
          <RecordsTable
            recordsPromise={recordsPromise}
            events={events.filter((e) => e.categoryId === selectedCat.id)}
          />
        </Suspense>
      </section>
    </SWRConfig>
  );
}

export default RecordsPage;
