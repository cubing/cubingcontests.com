"use client";

import { Countries } from "@cc/shared";
import { genericOnKeyDown } from "~/helpers/utilityFunctions.ts";

const countryOptions = [
  { name: "Select country", code: "NOT_SELECTED" },
  ...Countries,
];

const FormCountrySelect = ({
  countryIso2,
  setCountryIso2,
  nextFocusTargetId,
  disabled = false,
}: {
  countryIso2: string;
  setCountryIso2: any;
  nextFocusTargetId?: string;
  disabled?: boolean;
}) => {
  return (
    <div className="mb-3 fs-5">
      <label htmlFor="country_iso_2" className="form-label">
        Country
      </label>
      <select
        id="country_iso_2"
        className="form-select"
        value={countryIso2}
        onChange={(e) => setCountryIso2(e.target.value)}
        onKeyDown={(e: any) => genericOnKeyDown(e, { nextFocusTargetId })}
        disabled={disabled}
      >
        {countryOptions.map((el) => (
          <option key={el.code} value={el.code}>
            {el.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FormCountrySelect;
