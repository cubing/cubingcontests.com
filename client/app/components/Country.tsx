import * as Flags from 'country-flag-icons/react/3x2';
import Countries from '@sh/Countries';

const Country = ({
  countryIso2,
  swapPositions = false,
  noText = false,
}: {
  countryIso2: string;
  swapPositions?: boolean;
  noText?: boolean;
}) => {
  const FlagComponent = (Flags as any)[countryIso2];

  const getCountry = (countryIso2: string): string => {
    return Countries.find((el) => el.code === countryIso2)?.name || 'ERROR';
  };

  return (
    <span className="d-inline-flex align-items-center gap-2">
      {!noText && swapPositions && getCountry(countryIso2)}
      {FlagComponent && FlagComponent({ title: getCountry(countryIso2), className: 'cc-flag-icon' })}
      {!noText && !swapPositions && getCountry(countryIso2)}
    </span>
  );
};

export default Country;
