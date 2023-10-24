import Link from 'next/link';
import Country from './Country';
import { IContest } from '@sh/interfaces';

const ContestName = ({ contest }: { contest: IContest }) => {
  return (
    <span className="d-flex align-items-center gap-2">
      {contest.countryIso2 !== 'ONLINE' && <Country countryIso2={contest.countryIso2} noText />}

      <Link href={`/competitions/${contest.competitionId}`} prefetch={false}>
        {contest.name}
      </Link>
    </span>
  );
};

export default ContestName;
