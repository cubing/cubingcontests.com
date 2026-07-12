import { Suspense } from "react";
import Markdown from "react-markdown";
import EventRules from "~/app/[slug]/rules/EventRules.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import { db } from "~/server/db/provider.ts";
import { getOrgDetails, getSettingFromDb } from "~/server/server-only-functions/server-only-functions.ts";

export const metadata = {
  title: "Rules",
  description: process.env.METADATA_RULES_DESCRIPTION,
};

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

async function RulesPage({ params }: Props) {
  const { slug } = await params;

  const organization = await getOrgDetails({ slug });
  const content = await getSettingFromDb({ key: "rules-page-content", organizationId: organization.id });

  const columns = {
    eventId: true,
    name: true,
    category: true,
    defaultRoundFormat: true,
    description: true,
    rule: true,
  } as const;

  const eventRulesPromise = Promise.all([
    db.query.events.findMany({
      columns,
      where: { organizationId: organization.id, hidden: false, category: { ne: "removed" }, rule: { isNotNull: true } },
      orderBy: { rank: "asc" },
    }),
    db.query.events.findMany({
      columns,
      where: {
        organizationId: organization.id,
        hidden: false,
        category: { ne: "removed" },
        rule: { isNull: true },
        description: { isNotNull: true },
      },
      orderBy: { rank: "asc" },
    }),
  ]);

  return (
    <section>
      <h2 className="mb-4 text-center">Rules</h2>

      <div className="lh-lg mb-3 px-3">
        <Markdown>{content}</Markdown>
      </div>

      <Suspense fallback={<Loading />}>
        <EventRules eventRulesPromise={eventRulesPromise} />
      </Suspense>
    </section>
  );
}

export default RulesPage;
