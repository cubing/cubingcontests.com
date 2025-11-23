"use client";

import FormInputLabel from "~/app/components/form/FormInputLabel.tsx";
import { Continents, Countries } from "~/helpers/Countries.ts";
import { genericOnKeyDown } from "~/helpers/utilityFunctions.ts";

type Props = {
  countryIso2: string;
  setCountryIso2: any;
  nextFocusTargetId?: string;
  continentOptions?: boolean;
  disabled?: boolean;
};

function FormCountrySelect({
  countryIso2,
  setCountryIso2,
  nextFocusTargetId,
  continentOptions = false,
  disabled = false,
}: Props) {
  return (
    <div className="fs-5">
      <FormInputLabel text={continentOptions ? "Region" : "Country"} inputId="country_iso_2" />

      <select
        id="country_iso_2"
        value={countryIso2}
        onChange={(e) => setCountryIso2(e.target.value)}
        onKeyDown={(e: any) => genericOnKeyDown(e, { nextFocusTargetId })}
        disabled={disabled}
        className="form-select mt-2"
      >
        {continentOptions ? (
          <>
            <option value="NOT_SELECTED">All regions</option>
            {Continents.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </>
        ) : (
          <option value="NOT_SELECTED">Select country</option>
        )}

        {Countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default FormCountrySelect;
