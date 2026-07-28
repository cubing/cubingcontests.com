import { eq } from "drizzle-orm";
import DataEntryScreen from "~/app/[slug]/mod/competition/[id]/DataEntryScreen.tsx";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { getMemberControlsContest } from "~/helpers/utility-functions.ts";
import { auth } from "~/server/auth.ts";
import { db } from "~/server/db/provider.ts";
import { type PersonResponse, personsPublicCols, personsTable } from "~/server/db/schema/persons.ts";
import { getContest } from "~/server/server-only-functions/contests-functions.ts";
import { authorizeUser, getEventCategories } from "~/server/server-only-functions/server-only-functions.ts";

type Props = {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ eventId?: string }>;
};

async function DataEntryPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { eventId } = await searchParams;
  const { member, organization, httpHeaders } = await authorizeUser({ useOrganization: true });

  const [contestData, eventCategories] = await Promise.all([
    getContest({ organizationId: organization!.id, competitionId: id, eventId }),
    getEventCategories({ organizationId: organization!.id }),
  ]);
  if (!contestData) return <LoadingError loadingEntity="contest results" />;

  const { contest, events, rounds, results, persons, recordConfigs, regions } = contestData;
  const eventIdOrFirst = eventId ?? events[0].eventId;
  let memberPerson: PersonResponse | undefined;

  if (contest.type === "online") {
    const [{ success: canSubmitOwnOnlineCompResult }, { success: canPublishContests }] = await Promise.all([
      auth.api.hasPermission({
        headers: httpHeaders,
        body: { permissions: { onlineComps: ["submit-own-result"] } },
      }),
      auth.api.hasPermission({
        headers: httpHeaders,
        body: { permissions: { competitions: ["publish"], meetups: ["publish"] } },
      }),
    ]);
    if (!member!.personId) {
      return (
        <LoadingError reason="You must have a competitor profile linked to your member profile to submit results" />
      );
    }
    if (!canSubmitOwnOnlineCompResult || (!canPublishContests && !["approved", "ongoing"].includes(contest.state))) {
      return <LoadingError reason="You are unauthorized to submit results for this contest" />;
    }
    memberPerson = (
      await db.select(personsPublicCols).from(personsTable).where(eq(personsTable.id, member!.personId))
    ).at(0);
  } else {
    const { success: canCreateAndUpdateContests } = await auth.api.hasPermission({
      headers: httpHeaders,
      body: { permissions: { competitions: ["create", "update"], meetups: ["create", "update"] } },
    });
    if (!canCreateAndUpdateContests || !getMemberControlsContest(member!, contest)) {
      return <LoadingError reason="You do not have access rights for this contest" />;
    }
  }

  return (
    <section>
      <ToastMessages className="mx-2" />

      <DataEntryScreen
        key={eventIdOrFirst}
        contest={contest}
        eventId={eventIdOrFirst}
        events={events}
        eventCategories={eventCategories}
        rounds={rounds}
        results={results}
        persons={memberPerson ? [...persons, memberPerson] : persons}
        recordConfigs={recordConfigs}
        regions={regions}
        memberPerson={memberPerson}
      />
    </section>
  );
}

export default DataEntryPage;
