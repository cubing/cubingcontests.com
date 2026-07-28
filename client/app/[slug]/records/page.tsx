import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { slugPath } from "~/helpers/utility-functions.ts";
import { db } from "~/server/db/provider.ts";
import { eventCategoriesTable } from "~/server/db/schema/event-categories.ts";
import { getOrgDetails } from "~/server/server-only-functions/server-only-functions.ts";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

async function RecordsRedirectPage({ params }: Props) {
  const { slug } = await params;

  const organization = await getOrgDetails({ slug });
  const [firstCategory] = await db
    .select({ categoryId: eventCategoriesTable.categoryId })
    .from(eventCategoriesTable)
    .where(and(eq(eventCategoriesTable.organizationId, organization.id), eq(eventCategoriesTable.hidden, false)))
    .orderBy(eventCategoriesTable.rank)
    .limit(1);

  if (!firstCategory) return <LoadingError reason="no public event categories found" />;

  redirect(slugPath(slug, `/records/${firstCategory.categoryId}`), "replace");
}

export default RecordsRedirectPage;
