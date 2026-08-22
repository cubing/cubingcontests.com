"use client";

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
  monospace,
  invalid,
  oneLine,
  className = "",
}: Props) {
  if (!id && !title) throw new Error("Neither title nor id are set in FormTextInput");
  if (setValue && onChange) throw new Error("setValue and onChange cannot be used at the same time in FormTextInput");

  const inputId = (id || title) as string;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextFocusTargetId) document.getElementById(nextFocusTargetId)?.focus();
    }

    onKeyDown?.(e);
  };

  return (
    <div className={`${oneLine ? "d-flex gap-3 align-items-center" : ""} ${className}`}>
      {title && <FormInputLabel text={title} inputId={inputId} tooltip={tooltip} className={oneLine ? "mb-0" : ""} />}

      <div className="d-flex justify-content-between gap-3 align-items-center">
        <input
          type="text"
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
          onBlur={onBlur}
          className={`form-control flex-grow-1 ${monospace ? "font-monospace" : ""} ${invalid ? "is-invalid" : ""}`}
        />
      </div>
    </div>
  );
}

export default FormTextInput;
