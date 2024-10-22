"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import FormInputLabel from "./FormInputLabel.tsx";
import { genericOnKeyDown } from "~/helpers/utilityFunctions.ts";
import Button from "~/app/components/UI/Button.tsx";

const FormTextInput = ({
  id,
  title,
  placeholder = "",
  tooltip,
  value,
  setValue,
  onChange,
  onClick,
  onFocus,
  onBlur,
  onKeyDown,
  nextFocusTargetId,
  autoFocus,
  required,
  disabled,
  submitOnEnter,
  password,
  monospace,
  invalid,
  noMargin,
  oneLine,
}: {
  id?: string;
  title?: string;
  placeholder?: string;
  tooltip?: string;
  value: string;
  setValue?: (val: any) => void;
  nextFocusTargetId?: string;
  required?: boolean;
  disabled?: boolean;
  password?: boolean;
  monospace?: boolean;
  submitOnEnter?: boolean;
  invalid?: boolean;
  noMargin?: boolean;
  oneLine?: boolean;
} & React.HTMLAttributes<HTMLInputElement>) => {
  if (!id && !title) {
    throw new Error("Neither title nor id are set in FormTextInput");
  }
  if (setValue && onChange) {
    throw new Error(
      "setValue and onChange cannot be used at the same time in FormTextInput",
    );
  }

  const [hidePassword, setHidePassword] = useState(password);

  const inputId = id || title;

  const handleFocus = (e: any) => {
    // Prevent the whole input from being highlighted
    e.target.selectionStart = e.target.selectionEnd;
    if (onFocus) onFocus(e);
  };

  const handleKeyDown = (e: any) => {
    if (password && e.key === "Enter") setHidePassword(true);
    genericOnKeyDown(e, { nextFocusTargetId, onKeyDown, submitOnEnter });
  };

  const handleBlur = (e: any) => {
    if (password) setHidePassword(true);
    if (onBlur) onBlur(e);
  };

  return (
    <div
      className={`fs-5 ${noMargin ? "" : " mb-3"} ${oneLine ? "d-flex align-items-center gap-3" : ""}`}
    >
      <FormInputLabel text={title} inputId={inputId} tooltip={tooltip} />

      {/* mb-2 is to offset the bottom margin of the label */}
      <div
        className={`d-flex justify-content-between align-items-center gap-3 ${oneLine ? "mb-2" : ""}`}
      >
        <input
          type={hidePassword ? "password" : "text"}
          id={inputId}
          value={value}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          required={required}
          onChange={setValue ? (e) => setValue(e.target.value) : onChange}
          onKeyDown={handleKeyDown}
          onClick={onClick}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={"form-control flex-grow-1" +
            (monospace ? " font-monospace" : "") +
            (invalid ? " is-invalid" : "")}
        />

        {password && (
          <Button
            onClick={() => setHidePassword(!hidePassword)}
            className="px-2"
            aria-label="Toggle show password"
          >
            <FontAwesomeIcon
              icon={hidePassword ? faEye : faEyeSlash}
              style={{ width: "1.3rem" }}
            />
          </Button>
        )}
      </div>
    </div>
  );
};

export default FormTextInput;
