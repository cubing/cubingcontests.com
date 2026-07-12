import { redirect } from "next/navigation";
import { connection } from "next/server";
import Markdown from "react-markdown";
import z from "zod";
import { getSettingFromDb } from "~/server/server-only-functions/server-only-functions.ts";

async function PrivacyPage() {
  await connection();

  const privacyPolicy = await getSettingFromDb({ key: "privacy-policy", organizationId: null, optional: true });

  if (!privacyPolicy) return <p className="fs-4 mx-3 mt-5 text-center">The privacy policy page is disabled</p>;

  const isExternalLink = z.url().safeParse(privacyPolicy).success;

  if (isExternalLink) redirect(privacyPolicy);

  return (
    <section className="px-3 pb-3">
      <h2 className="mb-4 text-center">Privacy Policy</h2>

      <Markdown>{privacyPolicy}</Markdown>
    </section>
  );
}

export default PrivacyPage;
