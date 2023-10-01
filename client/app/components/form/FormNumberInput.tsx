'use client';

import { useEffect, useState } from 'react';

const FormNumberInput = ({
  title,
  id,
  placeholder,
  value,
  onChange,
  onKeyDown,
  disabled = false,
  integer = false,
  min = -Infinity,
  max = Infinity,
  invalid = false,
  noMargin = false,
}: {
  title?: string;
  id?: string;
  placeholder?: string;
  // undefined is the empty value, null is the invalid value
  value: number | null | undefined;
  onChange: (val: number) => void;
  onKeyDown?: (e: any) => void;
  disabled?: boolean;
  integer?: boolean;
  min?: number;
  max?: number;
  invalid?: boolean;
  noMargin?: boolean;
}) => {
  if (!id && !title) throw new Error('Neither title nor id are set in FormNumberInput');

  const [displayValue, setDisplayValue] = useState(value?.toString() || '');

  const inputId = id || title;

  useEffect(() => {
    if (value === undefined) setDisplayValue('');
    else if (value !== null) setDisplayValue(value.toString());
  }, [value]);

  const validateAndChange = (newValue: string) => {
    setDisplayValue(newValue);

    const numberValue = Number(newValue);

    if (
      newValue !== '' &&
      !/[^0-9.-]/.test(newValue) &&
      !isNaN(numberValue) &&
      (!integer || !newValue.includes('.')) &&
      numberValue >= min &&
      numberValue <= max
    ) {
      onChange(numberValue);
    } else if (newValue) {
      onChange(null);
    } else {
      onChange(undefined);
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter') e.preventDefault();
    if (onKeyDown) onKeyDown(e);
  };

  return (
    <div className={`fs-5 ${noMargin ? '' : 'mb-3'}`}>
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
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`form-control ${value === null || invalid ? 'is-invalid' : ''}`}
      />
    </div>
  );
};

export default FormNumberInput;
