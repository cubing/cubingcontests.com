import myFetch from '~/helpers/myFetch';
import ContestLayout from '@c/ContestLayout';
import ContestResults from '@c/ContestResults';
import C from '@sh/constants';
import { IContestData } from '@sh/types';

const ContestResultsPage = async ({ params }: { params: { id: string } }) => {
  const { payload: contestData }: { payload?: IContestData } = await myFetch.get(`/competitions/${params.id}`, {
    revalidate: C.contestResultsRev,
  });
  if (!contestData) return <h3 className="mt-4 text-center">Contest not found</h3>;

  console.log(contestData.contest.events[0].rounds[0].results);

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
