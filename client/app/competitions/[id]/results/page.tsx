import ContestLayout from "~/app/competitions/[id]/ContestLayout.tsx";
import ContestResults from "~/app/components/ContestResults.tsx";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { C } from "~/helpers/constants.ts";
import { ssrFetch } from "~/helpers/DELETEfetchUtils.ts";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ eventId?: string }>;
};

const ContestResultsPage = async ({ params, searchParams }: Props) => {
  const { id } = await params;
  const { eventId } = await searchParams;
  const contestDataResponse = await ssrFetch(`/competitions/${id}?eventId=${eventId ?? "FIRST_EVENT"}`, {
    revalidate: C.contestsRev,
  });
  if (!contestDataResponse.success) return <LoadingError loadingEntity="contest" />;
  const { contest, persons, activeRecordTypes } = contestDataResponse.data;

  return (
    <ContestLayout contest={contest} activeTab="results">
      <ContestResults contest={contest} persons={persons} activeRecordTypes={activeRecordTypes} />
    </ContestLayout>
  );
};

export default ContestResultsPage;
