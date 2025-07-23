"use client";

import { Countries } from "~/helpers/Countries.ts";
import FormInputLabel from "~/app/components/form/FormInputLabel";
import { genericOnKeyDown } from "~/helpers/utilityFunctions.ts";

const countryOptions = [
  { name: "Select country", code: "NOT_SELECTED" },
  ...Countries,
];

type Props = {
  countryIso2: string;
  setCountryIso2: any;
  nextFocusTargetId?: string;
  continentOptions?: boolean;
  disabled?: boolean;
};

const FormCountrySelect = ({
  countryIso2,
  setCountryIso2,
  nextFocusTargetId,
  continentOptions = false,
  disabled = false,
}: Props) => {
  return (
    <div className="fs-5">
      <FormInputLabel text="Country" inputId="country_iso_2" />

      <select
        id="country_iso_2"
        value={countryIso2}
        onChange={(e) => setCountryIso2(e.target.value)}
        onKeyDown={(e: any) => genericOnKeyDown(e, { nextFocusTargetId })}
        disabled={disabled}
        className="form-select mt-2"
      >
        {continentOptions && (
          <>
            <option value="">All regions</option>
            <option value="AF">Africa</option>
            <option value="AS">Asia</option>
            <option value="EU">Europe</option>
            <option value="NA">North America</option>
            <option value="OC">Oceania</option>
            <option value="SA">South America</option>
          </>
        )}
        {countryOptions.map((el) => <option key={el.code} value={el.code}>{el.name}</option>)}
      </select>
    </div>
  );
};

export default FormCountrySelect;
