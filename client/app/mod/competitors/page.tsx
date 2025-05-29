import ManageCompetitorsScreen from "~/app/mod/competitors/ManageCompetitorsScreen.tsx";
import { getModPersonsSF } from "~/server/persons/personsServerFunctions.ts";

type Props = {};

async function CompetitorsPage({}: Props) {
  const res = await getModPersonsSF();

  if (!res.success) return <h3 className="mt-4 text-center">Error while fetching persons</h3>;

  return <ManageCompetitorsScreen modPersonsData={res.data} />;
}

export default CompetitorsPage;
