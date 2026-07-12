import DebugScreen from "~/app/admin/debug/DebugScreen.tsx";
import { authorizeUser } from "~/server/server-only-functions/server-only-functions.ts";

async function DebugPage() {
  await authorizeUser({ useOrganization: false, role: "admin" });

  return <DebugScreen />;
}

export default DebugPage;
