import { ssrFetch } from "~/helpers/fetchUtils.ts";
import ContestLayout from "~/app/competitions/ContestLayout.tsx";
import ContestResults from "~/app/components/ContestResults.tsx";
import { IContestData } from "~/shared_helpers/types.ts";

type Props = {
  params: { id: string };
  searchParams: { eventId?: string };
};

const ContestResultsPage = async ({ params: { id }, searchParams: { eventId } }: Props) => {
  const { payload: contestData } = await ssrFetch(`/competitions/${id}?eventId=${eventId ?? "FIRST_EVENT"}`);
  if (!contestData) return <h3 className="mt-4 text-center">Error while loading contest</h3>;

  return (
    <ContestLayout contest={contestData.contest} activeTab="results">
      <ContestResults
        contest={contestData.contest}
        persons={contestData.persons}
        activeRecordTypes={contestData.activeRecordTypes}
      />
    </ContestLayout>
  );
};

export default ContestResultsPage;
