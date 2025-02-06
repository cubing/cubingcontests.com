import * as Flags from "country-flag-icons/react/3x2";
import { Countries } from "~/helpers/Countries.ts";

type Props = {
  countryIso2: string;
  swapPositions?: boolean;
  noText?: boolean;
  shorten?: boolean;
};

const Country = ({
  countryIso2,
  swapPositions,
  noText,
  shorten,
}: Props) => {
  if (noText && shorten) {
    throw new Error(
      "Country does not support the noText and shorten arguments at the same time",
    );
  }

  const FlagComponent = (Flags as any)[countryIso2];

  const getCountry = (countryIso2: string): string => {
    const country = Countries.find((el) => el.code === countryIso2);

    if (!country) return "NOT FOUND";

    if (shorten && country.shortName) return country.shortName;

    return country.name;
  };

  return (
    <span className="d-inline-flex align-items-center gap-2">
      {!noText && swapPositions && getCountry(countryIso2)}
      {FlagComponent &&
        FlagComponent({
          title: getCountry(countryIso2),
          className: "cc-flag-icon",
          style: { height: "1.16rem" },
        })}
      {!noText && !swapPositions && getCountry(countryIso2)}
    </span>
  );
};

export default Country;
