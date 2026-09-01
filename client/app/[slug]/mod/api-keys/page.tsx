import { SWRConfig } from "swr";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { SwrKey } from "~/helpers/swr-keys.ts";
import type { ContestApiKeyMetadata } from "~/helpers/types.ts";
import { auth } from "~/server/auth.ts";
import { getModContestsSF } from "~/server/server-functions/contest-server-functions.ts";
import { authorizeUser, getOrgDetails, getRegions } from "~/server/server-only-functions/server-only-functions.ts";
import ManageApiKeysScreen from "./ApiKeysScreen.tsx";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

async function ApiKeysPage({ params }: Props) {
  const { slug } = await params;
  const { httpHeaders } = await authorizeUser({
    useOrganization: true,
    orgPermissions: { modDashboard: ["view"], competitions: ["create", "update"], meetups: ["create", "update"] },
  });

  const [organization, contestsRes, apiKeys] = await Promise.all([
    getOrgDetails({ slug }),
    getModContestsSF({}),
    auth.api
      .listApiKeys({
        query: {
          configId: "contest_keys",
          sortBy: "createdAt",
          sortDirection: "desc",
        },
        headers: httpHeaders,
      })
      .then((res) =>
        res.apiKeys.map((apiKey) => ({
          id: apiKey.id,
          name: apiKey.name,
          rateLimitMax: apiKey.rateLimitMax,
          createdAt: apiKey.createdAt,
          expiresAt: apiKey.expiresAt,
          metadata: apiKey.metadata as ContestApiKeyMetadata,
        })),
      ),
  ]);

  if (!contestsRes.data) return <LoadingError loadingEntity="api keys" />;

  const regionsPromise = getRegions(organization.id);

  return (
    <SWRConfig value={{ fallback: { [SwrKey.Regions]: regionsPromise } }}>
      <section>
        <h2 className="mb-4 text-center">API Keys</h2>

        <ToastMessages className="mx-2" />

        <ManageApiKeysScreen
          contests={contestsRes.data!.contests.filter((c) => c.state !== "created")}
          apiKeys={apiKeys}
        />
      </section>
    </SWRConfig>
  );
}

export default ApiKeysPage;
