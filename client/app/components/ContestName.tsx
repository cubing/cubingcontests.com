import Link from 'next/link';
import Country from './Country';
import { IContest } from '@sh/interfaces';

const ContestName = ({ competition }: { competition: IContest }) => {
  return (
    <span className="d-flex align-items-center gap-2">
      {competition.countryIso2 !== 'ONLINE' && <Country countryIso2={competition.countryIso2} noText />}
      <Link href={`/competitions/${competition.competitionId}`}>{competition.name}</Link>
    </span>
  );
};

export default ContestName;
