import { useParams } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import useSWR from "swr";
import { authClient } from "~/helpers/auth-client.ts";
import type { FeaturesInfo, FullSession } from "~/helpers/types.ts";
import { getActionError } from "~/helpers/utility-functions.ts";
import { getFeaturesInfoSF, getOrgDetailsSF } from "~/server/server-functions/server-functions.ts";

export function useSession(): Partial<FullSession> {
  const { slug }: { slug?: string } = useParams();
  const { data: session } = authClient.useSession();

  const { data } = useSWR(
    ["user-full-session", slug, session],
    async () => {
      const [memberRes, orgDetailsRes] = await Promise.all([
        session?.session.activeOrganizationId ? authClient.organization.getActiveMember() : undefined,
        session?.session.activeOrganizationId
          ? getOrgDetailsSF({ id: session.session.activeOrganizationId })
          : slug
            ? getOrgDetailsSF({ slug })
            : undefined,
      ]);

      return {
        ...session,
        member: memberRes?.data ?? undefined,
        organization: orgDetailsRes?.data,
      };
    },
    {
      suspense: true,
      fallbackData: { session: undefined, user: undefined, member: undefined, organization: undefined },
    },
  );

  return data;
}

export function usePageNumber() {
  return useQueryState("p", parseAsInteger.withDefault(1));
}

export function useFeaturesInfo(): FeaturesInfo {
  const fallbackData: FeaturesInfo = {
    aboutPageEnabled: false,
    rulesPageEnabled: false,
    modInstructionsPageEnabled: false,
    videoBasedResultsEnabled: false,
    publicExportsEnabled: false,
    privacyPolicy: "disabled" as const,
  };

  const { slug }: { slug?: string } = useParams();

  const { data: featuresInfo } = useSWR(
    ["features-info", slug],
    () =>
      getFeaturesInfoSF({ slug }).then((res) => {
        if (res.serverError || res.validationErrors) console.error(getActionError(res));
        return res.data ?? fallbackData;
      }),
    { fallbackData },
  );

  return featuresInfo;
}
