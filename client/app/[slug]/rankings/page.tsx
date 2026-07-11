import { redirect } from "next/navigation";
import { eventCategories } from "~/helpers/event-categories.ts";
import { slugPath } from "~/helpers/utility-functions.ts";
import { db } from "~/server/db/provider.ts";
import { getOrgDetails } from "~/server/server-only-functions.ts";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

async function RankingsRedirectPage({ params }: Props) {
  const { slug } = await params;

  const organization = await getOrgDetails({ slug });
  const events = await db.query.events.findMany({
    columns: { eventId: true, category: true },
    where: { organizationId: organization.id, hidden: false },
    orderBy: { rank: "asc" },
  });

  if (events.length === 0) return <p>There are currently no events</p>;

  const firstCategory = eventCategories.find((ec) => events.some((e) => e.category === ec.value))!.value;
  const firstEvent = events.find((e) => e.category === firstCategory)!;

  redirect(slugPath(slug, `/rankings/${firstEvent.eventId}/single`), "replace");
}

export default RankingsRedirectPage;
