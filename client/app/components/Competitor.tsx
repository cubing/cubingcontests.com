import Country from './Country';
import { IPerson } from '@sh/interfaces';

const Competitor = ({
  person,
  showLocalizedName = false,
  noFlag = false,
  noLink = false,
}: {
  person: IPerson;
  showLocalizedName?: boolean;
  noFlag?: boolean;
  noLink?: boolean;
}) => {
  let displayText = person.name;
  if (showLocalizedName && person.localizedName) displayText += ` (${person.localizedName})`;

  if (person.wcaId)
    return (
      <span className={noFlag ? '' : 'd-flex align-items-center gap-2'}>
        {noLink ? (
          <span>{displayText}</span>
        ) : (
          <a href={`https://www.worldcubeassociation.org/persons/${person.wcaId}`} target="_blank">
            {displayText}
          </a>
        )}

        {!noFlag && <Country countryIso2={person.countryIso2} noText />}
      </span>
    );

  return person.name;
};

export default Competitor;
