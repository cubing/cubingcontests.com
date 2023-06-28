import myFetch from '~/helpers/myFetch';
import ContestResults from '@/components/ContestResults';
import { ICompetitionData } from '@sh/interfaces/Competition';

const Contest = async ({ params }: { params: { id: string } }) => {
  const data: ICompetitionData = await myFetch.get(`/competitions/${params.id}`, { revalidate: 600 });

  return (
    <>
      <h2 className="text-center">{data?.competition.name || 'Error'}</h2>
      {data && <ContestResults data={data} />}
    </>
  );
};

export default Contest;
