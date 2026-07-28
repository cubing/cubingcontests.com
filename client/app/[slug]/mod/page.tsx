import Link from "next/link";
import { Suspense } from "react";
import { SWRConfig, unstable_serialize as serialize } from "swr";
import { type ModDashboardFiltersDto, ModDashboardFiltersValidator } from "~/app/[slug]/mod/ModDashboardFilters.ts";
import DonateButton from "~/app/components/content/DonateButton.tsx";
import SocialLinkButton from "~/app/components/content/SocialLinkButton.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { C, IS_CUBING_CONTESTS_INSTANCE, IS_RR_INSTANCE } from "~/helpers/constants.ts";
import { getHasRole, slugPath } from "~/helpers/utility-functions.ts";
import { auth } from "~/server/auth.ts";
import { db } from "~/server/db/provider.ts";
import { getModContestsSF } from "~/server/server-functions/contest-server-functions.ts";
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

async function ModeratorDashboardPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const filters = ModDashboardFiltersValidator.parse(await searchParams);
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
    discordServerLink,
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
    getSettingFromDb({ key: "discord-server-link", organizationId: organization!.id, optional: true }),
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
            slug={slug}
            showBillingTodo={showBillingTodo}
            showLinkPersonTodo={showLinkPersonTodo}
            showAddEventsTodo={showAddEventsTodo}
            showCreateContestTodo={showCreateContestTodo}
          />
        )}

        {maxMonthlyContestsReached && <p className="fw-bold text-danger">{C.message.maxMonthlyContestsReached}</p>}

        <div className="d-flex fs-5 column-gap-2 column-gap-xl-3 row-gap-2 my-3 flex-wrap">
          {!maxMonthlyContestsReached && !isEventsListEmpty && (
            <Link
              href={slugPath(slug, "/mod/competition")}
              prefetch={false}
              className="btn btn-success btn-sm btn-lg-md"
            >
              Create new contest
            </Link>
          )}
          <Link href={slugPath(slug, "/mod/competitors")} prefetch={false} className="btn btn-warning btn-sm btn-lg-md">
            Manage competitors
          </Link>
          {isAdminView && (
            <Link href={slugPath(slug, "/mod/api-keys")} prefetch={false} className="btn btn-warning btn-sm btn-lg-md">
              API keys
            </Link>
          )}
          {isAdminView ? (
            <>
              <Link href={slugPath(slug, "/mod/members")} prefetch={false} className="btn btn-warning btn-sm btn-lg-md">
                Manage members
              </Link>
              <Link
                href={slugPath(slug, "/mod/events")}
                prefetch={false}
                className="btn btn-secondary btn-sm btn-lg-md"
              >
                Configure events
              </Link>
              <Link
                href={slugPath(slug, "/mod/records-configuration")}
                prefetch={false}
                className="btn btn-secondary btn-sm btn-lg-md"
              >
                Configure records
              </Link>
              {IS_RR_INSTANCE && isOwner && (
                <Link href={slugPath(slug, "/billing")} prefetch={false} className="btn btn-secondary btn-sm btn-lg-md">
                  Billing
                </Link>
              )}
            </>
          ) : (
            IS_CUBING_CONTESTS_INSTANCE && (
              <a
                href="https://docs.google.com/forms/d/12AuZdtH4qHwTxd4Kxd2Y_TwZHlBuBu8XuKX3VdKrE60"
                target="_blank"
                rel="noreferrer"
                className="btn btn-light btn-sm btn-lg-md"
              >
                Request new event
              </a>
            )
          )}
          <SocialLinkButton link={discordServerLink} logo="discord" className="btn-sm">
            Discord server
          </SocialLinkButton>
          {organization!.metadata.showDonationLinks && <DonateButton />}
        </div>
      </div>

      <SWRConfig
        value={{
          fallback: {
            [serialize(["mod", filters])]: getModContestsSF(filters),
          },
        }}
      >
        <Suspense fallback={<Loading />}>
          <ModDashboardScreen regions={regions} isAdminView={isAdminView} />
        </Suspense>
      </SWRConfig>
    </section>
  );
}

export default ModeratorDashboardPage;
