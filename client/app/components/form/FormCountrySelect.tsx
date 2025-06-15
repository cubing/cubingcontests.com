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
  disabled?: boolean;
};

const FormCountrySelect = ({
  countryIso2,
  setCountryIso2,
  nextFocusTargetId,
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
        {countryOptions.map((el) => <option key={el.code} value={el.code}>{el.name}</option>)}
      </select>
    </div>
  );
};

export default FormCountrySelect;
