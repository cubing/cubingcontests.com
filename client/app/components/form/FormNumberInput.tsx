'use client';

import { useEffect, useState } from 'react';

const FormNumberInput = ({
  title,
  id,
  placeholder,
  value,
  onChange,
  disabled = false,
  integer = false,
  noNegative = false,
  noZero = false,
  noMargin = false,
}: {
  title?: string;
  id?: string;
  placeholder?: string;
  value: number | null;
  onChange: (val: number) => void;
  disabled?: boolean;
  integer?: boolean;
  noNegative?: boolean;
  noZero?: boolean;
  noMargin?: boolean;
}) => {
  if (!id && !title) throw new Error('Neither title nor id are set in FormNumberInput');

  const [displayValue, setDisplayValue] = useState(value?.toString() || '');

  const inputId = id || title;

  useEffect(() => {
    if (value !== null) setDisplayValue(value.toString());
  }, [value]);

  const validateAndChange = (newValue: string) => {
    setDisplayValue(newValue);

    const numberValue = Number(newValue);

    if (
      newValue &&
      !/[^0-9.-]/.test(newValue) &&
      !isNaN(numberValue) &&
      (!integer || !newValue.includes('.')) &&
      (!noNegative || numberValue >= 0) &&
      (!noZero || numberValue !== 0)
    ) {
      onChange(numberValue);
    } else {
      onChange(null);
    }
  };

  return (
    <div className={'fs-5' + (noMargin ? '' : ' mb-3')}>
      {title && (
        <label htmlFor={inputId} className="form-label">
          {title}
        </label>
      )}
      <input
        type="text"
        id={inputId}
        value={displayValue}
        placeholder={placeholder}
        onChange={(e: any) => validateAndChange(e.target.value)}
        disabled={disabled}
        className={`form-control ${value === null ? ' is-invalid' : ''}`}
      />
    </div>
  );
};

export default FormNumberInput;
