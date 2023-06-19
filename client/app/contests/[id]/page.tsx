import { IWCIFCompetition } from '@sh/WCIF';

import ContestResults from '@/components/ContestResults';

const fetchContest = async (id: string): Promise<IWCIFCompetition> => {
  const res = await fetch(`http://localhost:5000/api/contests/${id}`, {
    next: {
      revalidate: 600,
    },
  });
  const json = await res.json();
  return json.contest;
};

const Contest = async ({ params }: { params: { id: string } }) => {
  const contest: IWCIFCompetition = await fetchContest(params.id);

  return (
    <>
      <h2 className="text-center">{contest.name}</h2>
      <ContestResults contest={contest} />
    </>
  );
};

export default Contest;
