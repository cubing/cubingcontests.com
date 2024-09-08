'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import FormInputLabel from './FormInputLabel';
import { genericOnKeyDown } from '~/helpers/utilityFunctions';

const FormTextInput = ({
  id,
  title,
  placeholder = '',
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
} & React.HTMLAttributes<HTMLInputElement>) => {
  if (!id && !title) throw new Error('Neither title nor id are set in FormTextInput');
  if (setValue && onChange) throw new Error('setValue and onChange cannot be used at the same time in FormTextInput');

  const [hidePassword, setHidePassword] = useState(password);

  const inputId = id || title;

  const handleFocus = (e: any) => {
    // Prevent the whole input from being highlighted
    e.target.selectionStart = e.target.selectionEnd;
    if (onFocus) onFocus(e);
  };

  const handleKeyDown = (e: any) => {
    if (password && e.key === 'Enter') setHidePassword(true);
    genericOnKeyDown(e, { nextFocusTargetId, onKeyDown, submitOnEnter });
  };

  const handleBlur = (e: any) => {
    if (password) setHidePassword(true);
    if (onBlur) onBlur(e);
  };

  return (
    <div className={'fs-5' + (noMargin ? '' : ' mb-3')}>
      <FormInputLabel text={title} inputId={inputId} tooltip={tooltip} />

      <div className="d-flex justify-content-between align-items-center gap-3">
        <input
          type={hidePassword ? 'password' : 'text'}
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
          className={'form-control flex-grow-1' + (monospace ? ' font-monospace' : '') + (invalid ? ' is-invalid' : '')}
        />
        {password && (
          <button
            type="button"
            onClick={() => setHidePassword(!hidePassword)}
            className="btn btn-primary py-1 px-2 fs-5"
            aria-label="Toggle show password"
          >
            {hidePassword ? <FontAwesomeIcon icon={faEye} className="" /> : <FontAwesomeIcon icon={faEyeSlash} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default FormTextInput;
