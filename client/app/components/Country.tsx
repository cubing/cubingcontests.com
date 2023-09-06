import * as Flags from 'country-flag-icons/react/3x2';
import { getCountry } from '~/helpers/utilityFunctions';

const Country = ({
  countryIso2,
  swapPositions = false,
  noText = false,
}: {
  countryIso2: string;
  swapPositions?: boolean;
  noText?: boolean;
}) => {
  return (
    <span className="d-inline-flex align-items-center gap-2">
      {!noText && swapPositions && getCountry(countryIso2)}
      {(Flags as any)[countryIso2]({ title: getCountry(countryIso2), className: 'cc-flag-icon' })}
      {!noText && !swapPositions && getCountry(countryIso2)}
    </span>
  );
};

export default Country;
