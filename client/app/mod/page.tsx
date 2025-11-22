import { getModContestsSF } from "~/server/serverFunctions/contestServerFunctions.ts";
import { authorizeUser } from "~/server/serverUtilityFunctions.ts";
import ModDashboardScreen from "./ModDashboardScreen.tsx";

type Props = {
  searchParams: Promise<{ organizerPersonId: string }>;
};

async function ModeratorDashboardPage({ searchParams }: Props) {
  const session = await authorizeUser({ permissions: { modDashboard: ["view"] } });
  const { organizerPersonId } = await searchParams;

  const res = await getModContestsSF({ organizerPersonId: organizerPersonId ? Number(organizerPersonId) : undefined });

  if (!res.data) return <h3 className="mt-4 text-center">Error while loading contests</h3>;

  return <ModDashboardScreen contests={res.data} session={session} />;
}

export default ModeratorDashboardPage;
