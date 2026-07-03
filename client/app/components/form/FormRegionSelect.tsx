"use client";

import FormInputLabel from "~/app/components/form/FormInputLabel.tsx";
import { C } from "~/helpers/constants.ts";
import type { SelectRegion } from "~/server/db/schema/regions.ts";

type Props = {
  regionCode: string | typeof C.notSelectedOption;
  setRegionCode: (value: string | typeof C.notSelectedOption) => void;
  regions: Pick<SelectRegion, "code" | "name" | "shortName" | "type">[];
  nextFocusTargetId?: string;
  continentOptions?: boolean;
  disabled?: boolean;
};

function FormRegionSelect({
  regionCode,
  setRegionCode,
  regions,
  nextFocusTargetId,
  continentOptions = false,
  disabled = false,
}: Props) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextFocusTargetId) document.getElementById(nextFocusTargetId)?.focus();
    }
  };

  return (
    <div className="fs-5">
      <FormInputLabel text="Region" inputId="region_code" />

      <select
        id="region_code"
        value={regionCode}
        onChange={(e) => setRegionCode(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="form-select"
      >
        {continentOptions ? (
          <>
            <option value={C.notSelectedOption}>All regions</option>
            {regions
              .filter((r) => r.type === "super-region")
              .map((r) => (
                <option key={r.code} value={r.code}>
                  {r.shortName}
                </option>
              ))}
          </>
        ) : (
          <option value={C.notSelectedOption}>Select region</option>
        )}

        {regions
          .filter((r) => ["country", "region"].includes(r.type))
          .map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
      </select>
    </div>
  );
}

export default FormRegionSelect;
