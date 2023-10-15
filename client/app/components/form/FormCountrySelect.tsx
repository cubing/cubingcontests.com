'use client';

import Countries from '@sh/Countries';
import { genericOnKeyDown } from '~/helpers/utilityFunctions';

// Add not selected option and remove online option
const countries = [{ name: 'Select country', code: 'NOT_SELECTED' }, ...Countries.slice(1)];

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
