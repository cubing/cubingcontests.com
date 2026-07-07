import LoadingError from "~/app/components/UI/LoadingError.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { auth } from "~/server/auth.ts";
import { getModContestsSF } from "~/server/server-functions/contest-server-functions.ts";
import { authorizeUser } from "~/server/server-only-functions.ts";
import ManageApiKeysScreen from "./ApiKeysScreen.tsx";

async function ApiKeysPage() {
  const { httpHeaders } = await authorizeUser({
    useOrganization: true,
    orgPermissions: { modDashboard: ["view"], competitions: ["create", "update"], meetups: ["create", "update"] },
  });

  const [contestsRes, apiKeysData] = await Promise.all([
    getModContestsSF({}),
    auth.api.listApiKeys({
      query: {
        configId: "contest_keys",
        sortBy: "createdAt",
        sortDirection: "desc",
      },
      headers: httpHeaders,
    }),
  ]);

  if (!contestsRes.data) return <LoadingError loadingEntity="api keys" />;

  return (
    <section>
      <h2 className="mb-4 text-center">API Keys</h2>

      <ToastMessages className="mx-2" />

      <ManageApiKeysScreen contests={contestsRes.data!.contests} apiKeys={apiKeysData.apiKeys as any} />
    </section>
  );
}

export default ApiKeysPage;
