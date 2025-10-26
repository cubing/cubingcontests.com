import { db } from "~/server/db/provider.ts";
import ConfigureRecordsScreen from "./ConfigureRecordsScreen.tsx";
import { authorizeUser } from "~/server/serverUtilityFunctions.ts";
import { recordConfigsPublicCols, recordConfigsTable as table } from "~/server/db/schema/record-configs.ts";

async function RecordsConfigurationPage() {
  await authorizeUser({ permissions: { recordConfigs: ["create-and-update"] } });

  const recordConfigs = await db.select(recordConfigsPublicCols).from(table).orderBy(table.rank);

  return (
    <section>
      <h2 className="mb-4 text-center">Records Configuration</h2>

      <ConfigureRecordsScreen recordConfigs={recordConfigs} />
    </section>
  );
}

export default RecordsConfigurationPage;
