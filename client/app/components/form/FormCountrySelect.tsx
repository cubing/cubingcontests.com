'use client';

import { useEffect } from 'react';
import Countries from '@sh/Countries';

const FormCountrySelect = ({
  countryIso2,
  setCountryId,
  disabled = false,
}: {
  countryIso2: string;
  setCountryId: any;
  disabled?: boolean;
}) => {
  useEffect(() => {
    // Set the first country from the list by default, unless already set
    if (!countryIso2) setCountryId(Countries[0].code);
  }, [countryIso2, setCountryId]);

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
        {Countries.map((el) => (
          <option key={el.code} value={el.code}>
            {el.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FormCountrySelect;
