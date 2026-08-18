import { eq } from "drizzle-orm";
import { Suspense } from "react";
import { SWRConfig } from "swr";
import Loading from "~/app/components/UI/Loading.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { SwrKey } from "~/helpers/swr-keys.ts";
import type { SpaceType } from "~/helpers/types.ts";
import { db } from "~/server/db/provider.ts";
import { personsPublicCols, personsTable } from "~/server/db/schema/persons.ts";
import {
  authorizeUser,
  getMemberRequestDetails,
  getRegions,
  getSettingFromDb,
} from "~/server/server-only-functions/server-only-functions.ts";
import UserSettingsScreen from "./UserSettingsScreen.tsx";

async function UserSettingsPage() {
  const { member, organization } = await authorizeUser({ useOrganization: false });

  const [[person], regions, spaceType] = await Promise.all([
    member?.personId
      ? db.select(personsPublicCols).from(personsTable).where(eq(personsTable.id, member.personId)).limit(1)
      : [],
    member ? getRegions(member.organizationId) : undefined,
    organization ? getSettingFromDb({ key: "space-type", organizationId: organization.id }) : undefined,
  ]);

  return (
    <section className="px-3">
      <h2 className="mb-4 text-center">Settings</h2>

      <ToastMessages className="mb-4" />

      <SWRConfig
        value={{
          fallback: {
            [SwrKey.MemberRequestDetails]: member ? getMemberRequestDetails({ member }) : undefined,
            [SwrKey.MemberRequestInstructions]: member
              ? getSettingFromDb({ key: "member-request-instructions", organizationId: member.organizationId })
              : undefined,
          },
        }}
      >
        <Suspense fallback={<Loading />}>
          <UserSettingsScreen initPerson={person} regions={regions} spaceType={spaceType as SpaceType | undefined} />
        </Suspense>
      </SWRConfig>
    </section>
  );
}

export default UserSettingsPage;
