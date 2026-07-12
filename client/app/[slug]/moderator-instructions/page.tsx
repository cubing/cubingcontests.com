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
    <div className="lh-lg px-3 pb-4">
      <h2 className="mb-4 text-center">Moderator Instructions</h2>

      <Markdown>{content}</Markdown>
    </div>
  );
}

export default ModeratorInstructionsPage;
