'use client';

import { useEffect } from 'react';
import Countries from '@sh/Countries';

const FormCountrySelect = ({ countryId, setCountryId }: { countryId: string; setCountryId: any }) => {
  useEffect(() => {
    // Set the first country from the list by default
    setCountryId(Countries[0].code);
  }, [setCountryId]);

  return (
    <div className="mb-3">
      <label htmlFor="country_id" className="form-label">
        Country
      </label>
      <select id="country_id" className="form-select" value={countryId} onChange={(e) => setCountryId(e.target.value)}>
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
