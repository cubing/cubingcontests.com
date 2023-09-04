import * as Flags from 'country-flag-icons/react/3x2';
import { getCountry } from '~/helpers/utilityFunctions';

const Country = ({ countryIso2, noText = false }: { countryIso2: string; noText?: boolean }) => {
  return (
    <span className="mx-2 d-inline-flex align-items-center gap-2">
      {(Flags as any)[countryIso2]({ title: getCountry(countryIso2), className: 'cc-flag-icon' })}
      {!noText && getCountry(countryIso2)}
    </span>
  );
};

export default Country;
