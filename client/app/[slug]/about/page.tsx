import Markdown from "react-markdown";
import DonateSection from "~/app/components/content/DonateSection.tsx";
import { getOrgDetails, getSettingFromDb } from "~/server/server-only-functions/server-only-functions.ts";

export const metadata = {
  title: "About",
  description: process.env.METADATA_ABOUT_DESCRIPTION,
};

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

async function AboutPage({ params }: Props) {
  const { slug } = await params;

  const organization = await getOrgDetails({ slug });
  const content = await getSettingFromDb({
    key: "about-page-content",
    organizationId: organization.id,
    optional: true,
  });

  const kofiGoalProgressPromise = getSettingFromDb({ key: "kofi-goal-progress", organizationId: null, optional: true });

  return (
    <section className="px-3 pb-3">
      <h2 className="mb-4 text-center">About</h2>

      {content && (
        <div className="lh-lg">
          <Markdown>{content}</Markdown>
        </div>
      )}

      <DonateSection organization={organization} kofiGoalProgressPromise={kofiGoalProgressPromise} />
    </section>
  );
}

export default AboutPage;
