import myFetch from '~/helpers/myFetch';
import CompetitionResults from '@c/CompetitionResults';
import { ICompetitionData } from '@sh/interfaces';

const Competition = async ({ params }: { params: { id: string } }) => {
  const data: ICompetitionData = await myFetch.get(`/competitions/${params.id}`, { revalidate: 600 });

  return (
    <>
      <h2 className="text-center">{data.competition?.name || 'Error'}</h2>
      {data.competition && <CompetitionResults data={data} />}
    </>
  );
};

export default Competition;
