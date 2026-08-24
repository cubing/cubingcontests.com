import { SWRConfig } from "swr";
import Person from "~/app/components/Person.tsx";
import { SwrKey } from "~/helpers/swr-keys.ts";
import { db } from "~/server/db/provider.ts";
import { getOrgDetails, getRegions } from "~/server/server-only-functions/server-only-functions.ts";

type Props = {
  params: Promise<{
    slug: string;
    id: string;
  }>;
};

async function PersonPage({ params }: Props) {
  const { slug, id } = await params;
  const organization = await getOrgDetails({ slug });

  const [person, regions] = await Promise.all([
    db.query.persons.findFirst({ where: { organizationId: organization.id, id: parseInt(id, 10) } }),
    getRegions(organization.id),
  ]);

  return (
    <section>
      <SWRConfig value={{ fallback: { [SwrKey.Regions]: regions } }}>
        <Person person={person} noLink showWcaId showWcaLink />
      </SWRConfig>
    </section>
  );
}

export default PersonPage;
