'use client';

import { useEffect } from 'react';
import Countries from '@sh/Countries';

const FormCountrySelect = ({
  countryId,
  setCountryId,
  disabled = false,
}: {
  countryId: string;
  setCountryId: any;
  disabled?: boolean;
}) => {
  useEffect(() => {
    // Set the first country from the list by default, unless already set
    if (!countryId) setCountryId(Countries[0].code);
  }, [countryId, setCountryId]);

  return (
    <div className="mb-3 fs-5">
      <label htmlFor="country_id" className="form-label">
        Country
      </label>
      <select
        id="country_id"
        className="form-select"
        value={countryId}
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
