import { ssrFetch } from "~/helpers/fetchUtils.ts";
import ContestLayout from "~/app/competitions/ContestLayout.tsx";
import ContestResults from "~/app/components/ContestResults.tsx";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ eventId?: string }>;
};

const ContestResultsPage = async ({ params, searchParams }: Props) => {
  const { id } = await params;
  const { eventId } = await searchParams;
  const contestDataResponse = await ssrFetch(`/competitions/${id}?eventId=${eventId ?? "FIRST_EVENT"}`, {
    revalidate: 60,
  });
  if (!contestDataResponse.success) return <h3 className="mt-4 text-center">Error while loading contest</h3>;
  const { contest, persons, activeRecordTypes } = contestDataResponse.data;

  return (
    <ContestLayout contest={contest} activeTab="results">
      <ContestResults
        contest={contest}
        persons={persons}
        activeRecordTypes={activeRecordTypes}
      />
    </ContestLayout>
  );
};

export default ContestResultsPage;
