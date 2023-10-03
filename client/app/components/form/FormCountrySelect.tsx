'use client';

import Countries from '@sh/Countries';
import { genericOnKeyDown } from '~/helpers/utilityFunctions';

// Add not selected option and remove online option
const countries = [{ name: 'Select country', code: 'NOT_SELECTED' }, ...Countries.slice(1)];

const FormCountrySelect = ({
  countryIso2,
  setCountryId,
  nextFocusTargetId,
  disabled = false,
}: {
  countryIso2: string;
  setCountryId: any;
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
        onChange={(e) => setCountryId(e.target.value)}
        onKeyDown={(e: any) => genericOnKeyDown(e, { nextFocusTargetId })}
        disabled={disabled}
      >
        {countries.map((el) => (
          <option key={el.code} value={el.code}>
            {el.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FormCountrySelect;
