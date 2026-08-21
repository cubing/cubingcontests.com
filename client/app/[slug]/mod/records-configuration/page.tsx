import { eq } from "drizzle-orm";
import { Suspense } from "react";
import { SWRConfig } from "swr";
import Loading from "~/app/components/UI/Loading.tsx";
import { SwrKey } from "~/helpers/swr-keys.ts";
import { db } from "~/server/db/provider.ts";
import { recordConfigsPublicCols, recordConfigsTable as table } from "~/server/db/schema/record-configs.ts";
import { authorizeUser, getRegions } from "~/server/server-only-functions/server-only-functions.ts";
import ConfigureRecordsScreen from "./ConfigureRecordsScreen.tsx";

async function RecordsConfigurationPage() {
  const { organization } = await authorizeUser({
    useOrganization: true,
    orgPermissions: { recordConfigs: ["create-and-update"] },
  });

  const [recordConfigs, regions] = await Promise.all([
    db
      .select(recordConfigsPublicCols)
      .from(table)
      .where(eq(table.organizationId, organization!.id))
      .orderBy(table.rank),
    getRegions(organization!.id),
  ]);

  return (
    <section>
      <h2 className="mb-4 text-center">Records Configuration</h2>

      <SWRConfig value={{ fallback: { [SwrKey.Regions]: regions } }}>
        <Suspense fallback={<Loading />}>
          <ConfigureRecordsScreen recordConfigs={recordConfigs} />
        </Suspense>
      </SWRConfig>
    </section>
  );
}

export default RecordsConfigurationPage;
