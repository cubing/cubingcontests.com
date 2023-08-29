'use client';

import Countries from '@sh/Countries';

// Add not selected option and remove online option
const countries = [{ name: 'Select country', code: 'NOT_SELECTED' }, ...Countries.slice(1)];

const FormCountrySelect = ({
  countryIso2,
  setCountryId,
  disabled = false,
}: {
  countryIso2: string;
  setCountryId: any;
  disabled?: boolean;
}) => {
  return (
    <div className="mb-3 fs-5">
      <label htmlFor="country_id" className="form-label">
        Country
      </label>
      <select
        id="country_id"
        className="form-select"
        value={countryIso2}
        onChange={(e) => setCountryId(e.target.value)}
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
