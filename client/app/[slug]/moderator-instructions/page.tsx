import Markdown from "react-markdown";
import { getOrgDetails, getSettingFromDb } from "~/server/server-only-functions/server-only-functions.ts";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

async function ModeratorInstructionsPage({ params }: Props) {
  const { slug } = await params;

  const organization = await getOrgDetails({ slug });
  const content = await getSettingFromDb({
    key: "moderator-instructions-page-content",
    organizationId: organization.id,
    optional: true,
  });

  if (!content) return <p className="fs-4 mx-3 mt-5 text-center">This page is disabled</p>;

  return (
    <section>
      <h2 className="mb-4 text-center">Moderator Instructions</h2>

      <div className="lh-lg mb-3 px-3">
        <Markdown>{content}</Markdown>
      </div>
    </section>
  );
}

export default ModeratorInstructionsPage;
