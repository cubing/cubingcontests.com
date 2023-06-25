import ContestResults from '@/components/ContestResults';
import { ICompetitionData } from '@sh/interfaces/Competition';

const fetchCompetition = async (id: string) => {
  try {
    const res = await fetch(`http://localhost:4000/competitions/${id}`, {
      next: {
        revalidate: 600,
      },
    });
    return await res.json();
  } catch (err) {
    console.error(err);
  }
};

const Contest = async ({ params }: { params: { id: string } }) => {
  const data: ICompetitionData = await fetchCompetition(params.id);

  return (
    <>
      <h2 className="text-center">{data.competition.name}</h2>
      {data ? <ContestResults data={data} /> : <p>Error</p>}
    </>
  );
};

export default Contest;
