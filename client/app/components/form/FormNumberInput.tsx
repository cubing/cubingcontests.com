"use client";

import { useEffect, useState } from "react";
import FormInputLabel from "./FormInputLabel.tsx";
import { genericOnKeyDown } from "~/helpers/utilityFunctions.ts";
import { NumberInputValue } from "~/shared_helpers/types.ts";

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
  className = "",
}: {
  id?: string;
  title?: string;
  placeholder?: string;
  tooltip?: string;
  value: NumberInputValue;
  setValue: (val: NumberInputValue) => void;
  onKeyDown?: (e: any) => void;
  nextFocusTargetId?: string;
  disabled?: boolean;
  integer?: boolean;
  min?: number;
  max?: number;
  invalid?: boolean;
} & React.HTMLAttributes<HTMLElement>) => {
  if (!id && !title) {
    throw new Error("Neither title nor id are set in FormNumberInput");
  }

  const [displayValue, setDisplayValue] = useState(value?.toString() || "");

  const inputId = (id || title) as string;

  useEffect(() => {
    if (value === undefined) setDisplayValue("");
    else if (value !== null) setDisplayValue(value.toString());
  }, [value]);

  // The min or max changing could make the value no longer valid, hence this effect
  useEffect(() => {
    validateAndChange(displayValue);
  }, [min, max]);

  const validateAndChange = (newValue: string) => {
    setDisplayValue(newValue);

    // Update value (if it's different from its previous value)
    const numberValue = Number(newValue);

    if (
      newValue !== "" &&
      !/[^0-9.-]/.test(newValue) &&
      !isNaN(numberValue) &&
      (!integer || !newValue.includes(".")) &&
      numberValue >= min &&
      numberValue <= max
    ) {
      if (value !== numberValue) setValue(numberValue);
    } else if (newValue) {
      if (value !== null) setValue(null);
    } else if (value !== undefined) {
      setValue(undefined);
    }
  };

  return (
    <div className={`fs-5 ${className}`}>
      <FormInputLabel text={title} inputId={inputId} tooltip={tooltip} />

      <input
        type="text"
        id={inputId}
        value={displayValue}
        placeholder={placeholder}
        onChange={(e: any) => validateAndChange(e.target.value)}
        onKeyDown={(e: any) => genericOnKeyDown(e, { nextFocusTargetId, onKeyDown })}
        disabled={disabled}
        className={`form-control ${value === null || invalid ? "is-invalid" : ""}`}
      />
    </div>
  );
};

export default FormNumberInput;
