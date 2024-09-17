'use client';

import { useEffect, useState } from 'react';
import FormInputLabel from './FormInputLabel';
import { genericOnKeyDown } from '~/helpers/utilityFunctions';
import { NumberInputValue } from '@sh/types';

const FormNumberInput = ({
  id,
  title,
  placeholder,
  tooltip,
  value,
  setValue,
  onKeyDown,
  nextFocusTargetId,
  disabled = false,
  integer = false,
  min = -Infinity,
  max = Infinity,
  invalid = false,
  noMargin = false,
}: {
  id?: string;
  title?: string;
  placeholder?: string;
  tooltip?: string;
  value: NumberInputValue;
  setValue: (val: number) => void;
  onKeyDown?: (e: any) => void;
  nextFocusTargetId?: string;
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

  // The min or max changing could make the value no longer valid, hence this effect
  useEffect(() => {
    validateAndChange(displayValue);
  }, [min, max]);

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
      setValue(numberValue);
    } else if (newValue) {
      setValue(null);
    } else {
      setValue(undefined);
    }
  };

  return (
    <div className={`fs-5 ${noMargin ? '' : 'mb-3'}`}>
      <FormInputLabel text={title} inputId={inputId} tooltip={tooltip} />

      <input
        type="text"
        id={inputId}
        value={displayValue}
        placeholder={placeholder}
        onChange={(e: any) => validateAndChange(e.target.value)}
        onKeyDown={(e: any) => genericOnKeyDown(e, { nextFocusTargetId, onKeyDown })}
        disabled={disabled}
        className={`form-control ${value === null || invalid ? 'is-invalid' : ''}`}
      />
    </div>
  );
};

export default FormNumberInput;
