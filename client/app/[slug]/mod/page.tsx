import Link from "next/link";
import { Suspense } from "react";
import { SWRConfig } from "swr";
import type { ModDashboardFiltersDto } from "~/app/[slug]/mod/ModDashboardFilters.ts";
import DocsButton from "~/app/components/content/DocsButton.tsx";
import DonateButton from "~/app/components/content/DonateButton.tsx";
import SocialLinkButton from "~/app/components/content/SocialLinkButton.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { C, IS_RR_INSTANCE } from "~/helpers/constants.ts";
import { SwrKey } from "~/helpers/swr-keys.ts";
import { getHasRole, slugPath } from "~/helpers/utility-functions.ts";
import { auth } from "~/server/auth.ts";
import { db } from "~/server/db/provider.ts";
import {
  authorizeUser,
  getRegions,
  getSettingFromDb,
  validateMaxMonthlyContests,
} from "~/server/server-only-functions/server-only-functions.ts";
import ModDashboardScreen from "./ModDashboardScreen.tsx";
import SpaceTodoList from "./SpaceTodoList.tsx";

type Props = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<ModDashboardFiltersDto>;
};

async function ModeratorDashboardPage({ params }: Props) {
  const { slug } = await params;
  const { member, organization, httpHeaders } = await authorizeUser({
    useOrganization: true,
    orgPermissions: { modDashboard: ["view"] },
  });

  const [
    { success: isAdminView },
    { success: canUpdateMembers },
    regions,
    maxMonthlyContestsReached,
    isEventsListEmpty,
    isContestsListEmpty,
    spaceType,
    discordServerLink,
    scorecardsServiceLink,
    scorecardsLinkEnabled,
  ] = await Promise.all([
    auth.api.hasPermission({ headers: httpHeaders, body: { permissions: { adminDashboard: ["view"] } } }),
    auth.api.hasPermission({ headers: httpHeaders, body: { permissions: { member: ["update"] } } }),
    getRegions(organization!.id),
    validateMaxMonthlyContests(organization!)
      .then(() => false)
      .catch(() => true),
    db.query.events
      .findFirst({ columns: { id: true }, where: { organizationId: organization!.id } })
      .then((res) => !res),
    db.query.contests
      .findFirst({ columns: { id: true }, where: { organizationId: organization!.id } })
      .then((res) => !res),
    getSettingFromDb({ key: "space-type", organizationId: organization!.id }),
    getSettingFromDb({ key: "discord-server-link", organizationId: organization!.id, optional: true }),
    getSettingFromDb({ key: "scorecards-service-link", organizationId: null, optional: true }),
    getSettingFromDb({ key: "scorecards-link-enabled", organizationId: organization!.id, optional: true }),
  ]);

  const isOwner = getHasRole("owner", member!.role);
  const showBillingTodo = IS_RR_INSTANCE && isOwner && !organization?.subscription;
  const showLinkPersonTodo = isOwner && canUpdateMembers && !member!.personId;
  const showAddEventsTodo = isOwner && isEventsListEmpty;
  const showCreateContestTodo = isOwner && isContestsListEmpty;
  const showTodos = showBillingTodo || showLinkPersonTodo || showAddEventsTodo || showCreateContestTodo;

  return (
    <section>
      <h2 className="mx-2 mb-4 text-center">Dashboard</h2>

      <div className="px-2">
        <ToastMessages />

        {showTodos && (
          <SpaceTodoList
            organization={organization!}
            showBillingTodo={showBillingTodo}
            showLinkPersonTodo={showLinkPersonTodo}
            showAddEventsTodo={showAddEventsTodo}
            showCreateContestTodo={showCreateContestTodo}
          />
        )}

        {maxMonthlyContestsReached && <p className="fw-bold text-danger">{C.message.maxMonthlyContestsReached}</p>}

        <div className="d-flex fs-5 column-gap-2 column-gap-xl-3 row-gap-2 my-3 flex-wrap">
          {!maxMonthlyContestsReached && !isEventsListEmpty && (
            <Link href={slugPath(slug, "/mod/competition")} prefetch={false} className="btn btn-success btn-sm">
              Create New Competition
            </Link>
          )}
          <Link href={slugPath(slug, "/mod/competitors")} prefetch={false} className="btn btn-warning btn-sm">
            Manage Persons
          </Link>
          {!maxMonthlyContestsReached && !isEventsListEmpty && (
            <Link href={slugPath(slug, "/mod/api-keys")} prefetch={false} className="btn btn-warning btn-sm">
              API Keys
            </Link>
          )}
          {isAdminView && (
            <>
              <Link href={slugPath(slug, "/mod/members")} prefetch={false} className="btn btn-warning btn-sm">
                Manage Members
              </Link>
              <Link href={slugPath(slug, "/mod/events")} prefetch={false} className="btn btn-secondary btn-sm">
                Configure Events
              </Link>
              <Link
                href={slugPath(slug, "/mod/records-configuration")}
                prefetch={false}
                className="btn btn-secondary btn-sm"
              >
                Configure Records
              </Link>
              {IS_RR_INSTANCE && isOwner && (
                <Link href={slugPath(slug, "/billing")} prefetch={false} className="btn btn-secondary btn-sm">
                  Billing
                </Link>
              )}
            </>
          )}
          {scorecardsServiceLink && scorecardsLinkEnabled === "true" && (
            <a href={scorecardsServiceLink} target="_blank" rel="noopener" className="btn btn-secondary btn-sm">
              Scorecards
            </a>
          )}
          <DocsButton />
          <SocialLinkButton link={discordServerLink} logo="discord" className="btn-sm">
            Discord server
          </SocialLinkButton>
          {organization!.metadata.showDonationLinks && <DonateButton />}
        </div>
      </div>

      <SWRConfig
        value={{
          fallback: {
            [SwrKey.SpaceType]: spaceType,
            [SwrKey.Regions]: regions,
          },
        }}
      >
        <Suspense fallback={<Loading />}>
          <ModDashboardScreen isAdminView={isAdminView} />
        </Suspense>
      </SWRConfig>
    </section>
  );
}

export default ModeratorDashboardPage;
