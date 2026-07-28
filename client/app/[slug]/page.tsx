import Link from "next/link";
import { Suspense } from "react";
import Markdown from "react-markdown";
import BlogSection from "~/app/components/content/BlogSection.tsx";
import CollectiveCubing from "~/app/components/content/CollectiveCubing.tsx";
import DonateSection from "~/app/components/content/DonateSection.tsx";
import ModInstructionsSection from "~/app/components/content/ModInstructionsSection.tsx";
import SocialLinkButton from "~/app/components/content/SocialLinkButton.tsx";
import { slugPath } from "~/helpers/utility-functions.ts";
import { getBlogPosts, getOrgDetails, getSettingFromDb } from "~/server/server-only-functions/server-only-functions.ts";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

async function OrganizationHomePage({ params }: Props) {
  const { slug } = await params;

  const organization = await getOrgDetails({ slug });
  const [description, websiteLink, discordServerLink] = await Promise.all([
    getSettingFromDb({ key: "home-page-description", organizationId: organization.id, optional: true }),
    getSettingFromDb({ key: "website-link", organizationId: organization.id, optional: true }),
    getSettingFromDb({ key: "discord-server-link", organizationId: organization.id, optional: true }),
  ]);

  const latestBlogPostsPromise = getBlogPosts(organization.id, { limit: 2 });
  const modInstructionsPromise = getSettingFromDb({
    key: "moderator-instructions-page-content",
    organizationId: organization.id,
    optional: true,
  });
  const modInstructionsDescriptionPromise = getSettingFromDb({
    key: "moderator-instructions-description",
    organizationId: organization.id,
    optional: true,
  });
  const collectiveCubingEnabledSettingPromise = getSettingFromDb({
    key: "collective-cubing-enabled",
    organizationId: null,
    optional: true,
  });

  return (
    <section className="px-3">
      <h1 className="mb-4 text-center">{organization.name}</h1>

      {description && <Markdown>{description}</Markdown>}

      <div className="d-flex justify-content-center fs-5 my-4 flex-column flex-md-row gap-3 gap-lg-4 align-items-center">
        <Link href={slugPath(slug, "/about")} prefetch={false} className="rr-homepage-link btn btn-primary">
          About Us
        </Link>
        <Link href={slugPath(slug, "/competitions")} prefetch={false} className="rr-homepage-link btn btn-primary">
          See All Contests
        </Link>
        <Link href={slugPath(slug, "/records")} prefetch={false} className="rr-homepage-link btn btn-primary">
          See Current Records
        </Link>
        <Link href={slugPath(slug, "/rankings")} prefetch={false} className="rr-homepage-link btn btn-primary">
          See Rankings
        </Link>
      </div>

      {(websiteLink || discordServerLink) && (
        <>
          <h3 className="rr-basic-heading">Socials</h3>

          <div className="d-flex flex-wrap gap-3">
            <SocialLinkButton link={websiteLink}>Website</SocialLinkButton>
            <SocialLinkButton link={discordServerLink} logo="discord">
              Discord server
            </SocialLinkButton>
          </div>
        </>
      )}

      <DonateSection organization={organization} />

      <Suspense>
        <BlogSection latestBlogPostsPromise={latestBlogPostsPromise} />
      </Suspense>

      <Suspense>
        <ModInstructionsSection
          modInstructionsPromise={modInstructionsPromise}
          modInstructionsDescriptionPromise={modInstructionsDescriptionPromise}
        />
      </Suspense>

      <h3 className="rr-basic-heading">Contact</h3>
      <p>For general inquiries, send an email to {organization?.metadata.contactEmail || "ERROR"}.</p>

      <Suspense>
        <CollectiveCubing settingValuePromise={collectiveCubingEnabledSettingPromise} />
      </Suspense>
    </section>
  );
}

export default OrganizationHomePage;
