import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const FormTextInput = ({
  title,
  id,
  value,
  placeholder = '',
  setValue,
  onFocus,
  onBlur,
  onKeyDown,
  autoFocus = false,
  required = false,
  disabled = false,
  submitOnEnter = false,
  password = false,
  monospace = false,
}: {
  title?: string;
  id?: string;
  placeholder?: string;
  value: string;
  setValue: any;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: any) => void;
  autoFocus?: boolean;
  required?: boolean;
  disabled?: boolean;
  password?: boolean;
  monospace?: boolean;
  submitOnEnter?: boolean;
}) => {
  if (!id && !title) throw new Error('Neither title nor id are set in FormTextInput!');

  const [hidePassword, setHidePassword] = useState(password);

  const inputId = id || title;

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter' && !submitOnEnter) e.preventDefault();

    if (onKeyDown) onKeyDown(e);
  };

  return (
    <div className="mb-3 fs-5">
      {title && (
        <label htmlFor={inputId} className="form-label">
          {title}
        </label>
      )}
      <div className="d-flex justify-content-between align-items-center gap-3">
        <input
          type={hidePassword ? 'password' : 'text'}
          id={inputId}
          value={value}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          required={required}
          onChange={(e: any) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          className={'flex-grow-1 form-control' + (monospace ? ' font-monospace' : '')}
        />
        {password && (
          <button
            type="button"
            className="px-2 pt-0 pb-1 btn btn-primary fs-5"
            onClick={() => setHidePassword(!hidePassword)}
          >
            {hidePassword ? <FaEye /> : <FaEyeSlash />}
          </button>
        )}
      </div>
    </div>
  );
};

export default FormTextInput;
