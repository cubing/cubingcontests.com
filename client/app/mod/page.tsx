import { authorizeUser } from "~/server/serverUtilityFunctions.ts";
import ModDashboardScreen from "./ModDashboardScreen.tsx";

async function ModeratorDashboardPage() {
  await authorizeUser({ permissions: { modDashboard: ["view"] } });

  return <ModDashboardScreen contests={[]} />;
}

export default ModeratorDashboardPage;
