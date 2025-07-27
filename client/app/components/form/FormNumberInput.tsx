"use client";

import { useEffect, useState } from "react";
import FormInputLabel from "./FormInputLabel.tsx";
import { genericOnKeyDown } from "~/helpers/utilityFunctions.ts";

type Props = {
  id?: string;
  title?: string;
  placeholder?: string;
  tooltip?: string;
  value: number | undefined;
  setValue: (val: number | undefined) => void;
  onKeyDown?: (e: any) => void;
  nextFocusTargetId?: string;
  disabled?: boolean;
  integer?: boolean;
  min?: number;
  max?: number;
  invalid?: boolean;
} & React.HTMLAttributes<HTMLElement>;

function FormNumberInput({
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
}: Props) {
  if (!id && !title) {
    throw new Error("Neither title nor id are set in FormNumberInput");
  }

  const [displayValue, setDisplayValue] = useState(value?.toString() || "");

  const inputId = (id || title) as string;

  useEffect(() => {
    if (value === undefined) setDisplayValue("");
    else if (!Number.isNaN(value)) setDisplayValue(value.toString());
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
      !Number.isNaN(numberValue) &&
      (!integer || !newValue.includes(".")) &&
      numberValue >= min &&
      numberValue <= max
    ) {
      if (value !== numberValue) setValue(numberValue);
    } else if (newValue) {
      setValue(NaN);
    } else {
      setValue(undefined);
    }
  };

  return (
    <div className={`fs-5 ${className}`}>
      {title && <FormInputLabel text={title} inputId={inputId} tooltip={tooltip} />}

      <input
        type="text"
        id={inputId}
        value={displayValue}
        placeholder={placeholder}
        onChange={(e: any) => validateAndChange(e.target.value)}
        onKeyDown={(e: any) => genericOnKeyDown(e, { nextFocusTargetId, onKeyDown })}
        disabled={disabled}
        className={`form-control mt-2 ${Number.isNaN(value) || invalid ? "is-invalid" : ""}`}
      />
    </div>
  );
}

export default FormNumberInput;
