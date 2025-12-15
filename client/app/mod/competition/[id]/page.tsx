import DataEntryScreen from "~/app/components/adminAndModerator/DataEntryScreen.tsx";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { getContest } from "~/server/serverFunctions/contestServerFunctions.ts";
import { authorizeUser, getUserHasAccessToContest } from "~/server/serverUtilityFunctions.ts";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ eventId?: string }>;
};

async function PostResultsPage({ params, searchParams }: Props) {
  const { user } = await authorizeUser({ permissions: { competitions: ["create", "update"] } });
  const { id } = await params;
  const { eventId } = await searchParams;

  const res = await getContest({ competitionId: id, eventId });

  if (!res.data) return <LoadingError loadingEntity="contest results" />;

  const { contest, events, rounds, results, persons, recordConfigs } = res.data;
  const eventIdOrFirst = eventId ?? events[0].eventId;

  if (!contest) return <LoadingError reason="Contest not found" />;
  if (contest.state === "removed") return <LoadingError reason="This contest has been removed" />;
  if (!getUserHasAccessToContest(user, contest.organizerIds))
    return <LoadingError reason="You do not have access rights for this contest" />;

  return (
    <DataEntryScreen
      key={eventIdOrFirst}
      contest={contest}
      eventId={eventIdOrFirst}
      events={events}
      rounds={rounds}
      results={results}
      persons={persons}
      recordConfigs={recordConfigs}
    />
  );
}

export default PostResultsPage;
