import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { slugPath } from "~/helpers/utility-functions.ts";
import { db } from "~/server/db/provider.ts";
import { eventCategoriesTable } from "~/server/db/schema/event-categories.ts";
import { eventsTable } from "~/server/db/schema/events.ts";
import { getOrgDetails } from "~/server/server-only-functions/server-only-functions.ts";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

async function RankingsRedirectPage({ params }: Props) {
  const { slug } = await params;

  const organization = await getOrgDetails({ slug });
  const firstCategorySq = db
    .select()
    .from(eventCategoriesTable)
    .where(and(eq(eventCategoriesTable.organizationId, organization.id), eq(eventCategoriesTable.hidden, false)))
    .orderBy(eventCategoriesTable.rank)
    .limit(1)
    .as("sq");
  const [firstEvent] = await db
    .select({ eventId: eventsTable.eventId })
    .from(eventsTable)
    .innerJoin(firstCategorySq, eq(eventsTable.categoryId, firstCategorySq.id))
    .where(eq(eventsTable.hidden, false))
    .orderBy(eventsTable.rank)
    .limit(1);

  if (!firstEvent) return <LoadingError reason="no events found in the main event category" />;

  redirect(slugPath(slug, `/rankings/${firstEvent.eventId}/single`), "replace");
}

export default RankingsRedirectPage;
