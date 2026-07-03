"use client";

import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import Button from "~/app/components/UI/Button.tsx";
import FormInputLabel from "./FormInputLabel.tsx";

type Props = {
  id?: string;
  title?: string;
  placeholder?: string;
  tooltip?: string;
  value: string;
  setValue?: (val: any) => void;
  nextFocusTargetId?: string;
  disabled?: boolean;
  password?: boolean;
  monospace?: boolean;
  invalid?: boolean;
  oneLine?: boolean;
} & React.HTMLAttributes<HTMLInputElement>;

function FormTextInput({
  id,
  title,
  placeholder = "",
  tooltip,
  value,
  setValue,
  onChange,
  onKeyDown,
  onClick,
  onFocus,
  onSelect,
  onBlur,
  nextFocusTargetId,
  autoFocus,
  disabled,
  password,
  monospace,
  invalid,
  oneLine,
  className = "",
}: Props) {
  if (!id && !title) throw new Error("Neither title nor id are set in FormTextInput");
  if (setValue && onChange) throw new Error("setValue and onChange cannot be used at the same time in FormTextInput");

  const [hidePassword, setHidePassword] = useState(password);

  const inputId = (id || title) as string;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (password) setHidePassword(true);
      if (nextFocusTargetId) document.getElementById(nextFocusTargetId)?.focus();
    }

    onKeyDown?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement, Element>) => {
    if (password) setHidePassword(true);

    onBlur?.(e);
  };

  return (
    <div className={`fs-5 ${oneLine ? "d-flex gap-3 align-items-center" : ""} ${className}`}>
      {title && <FormInputLabel text={title} inputId={inputId} tooltip={tooltip} />}

      <div className="d-flex justify-content-between gap-3 align-items-center">
        <input
          type={hidePassword ? "password" : "text"}
          id={inputId}
          value={value}
          placeholder={placeholder}
          // biome-ignore lint/a11y/noAutofocus: meh
          autoFocus={autoFocus}
          disabled={disabled}
          onChange={setValue ? (e) => setValue(e.target.value) : onChange}
          onKeyDown={handleKeyDown}
          onClick={onClick}
          onFocus={onFocus}
          onSelect={onSelect}
          onBlur={handleBlur}
          className={`form-control flex-grow-1 ${monospace ? "font-monospace" : ""} ${invalid ? "is-invalid" : ""}`}
        />

        {password && (
          <Button
            onClick={() => setHidePassword(!hidePassword)}
            disabled={disabled}
            className="px-2"
            title="Toggle show password"
            ariaLabel="Toggle show password"
          >
            <FontAwesomeIcon icon={hidePassword ? faEye : faEyeSlash} style={{ width: "1.3rem" }} />
          </Button>
        )}
      </div>
    </div>
  );
}

export default FormTextInput;
