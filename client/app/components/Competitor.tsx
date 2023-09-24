import { IPerson } from '~/shared_helpers/interfaces';
import Country from './Country';

const Competitor = ({ person, noFlag = false }: { person: IPerson; noFlag?: boolean }) => {
  if (person.wcaId)
    return (
      <span className={noFlag ? `` : `d-flex align-items-center gap-2`}>
        <a href={`https://www.worldcubeassociation.org/persons/${person.wcaId}`} target="_blank">
          {person.name}
        </a>

        {!noFlag && <Country countryIso2={person.countryIso2} noText />}
      </span>
    );

  return person.name;
};

export default Competitor;
