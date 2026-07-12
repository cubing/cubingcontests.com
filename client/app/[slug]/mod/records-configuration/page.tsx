import { eq } from "drizzle-orm";
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

      <ConfigureRecordsScreen recordConfigs={recordConfigs} regions={regions} />
    </section>
  );
}

export default RecordsConfigurationPage;
