import ContestLayout from "~/app/competitions/[id]/ContestLayout.tsx";
import ContestResults from "~/app/components/ContestResults.tsx";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { getContest } from "~/server/serverFunctions/contestServerFunctions.ts";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ eventId?: string }>;
};

async function ContestResultsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { eventId } = await searchParams;

  const res = await getContest({ competitionId: id, eventId });

  if (!res.data) return <LoadingError loadingEntity="contest results" />;

  const { contest, events, rounds, results, persons, recordConfigs } = res.data;

  return (
    <ContestLayout contest={contest} activeTab="results">
      <ContestResults
        eventId={eventId ?? events[0].eventId}
        events={events}
        rounds={rounds}
        results={results}
        persons={persons}
        recordConfigs={recordConfigs}
      />
    </ContestLayout>
  );
}

export default ContestResultsPage;
