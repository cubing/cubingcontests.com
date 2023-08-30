import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const FormTextInput = ({
  title,
  id,
  value,
  placeholder = '',
  monospace = false,
  disabled = false,
  password = false,
  required = false,
  setValue,
  onFocus,
  onBlur,
  onKeyDown,
}: {
  title?: string;
  id?: string;
  placeholder?: string;
  monospace?: boolean;
  disabled?: boolean;
  password?: boolean;
  required?: boolean;
  value: string;
  setValue: any;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: any) => void;
}) => {
  const [hidePassword, setHidePassword] = useState(password);

  if (!id && !title) throw new Error('Neither title nor id are set in FormTextInput!');

  const inputId = id || title;

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
          disabled={disabled}
          required={required}
          onChange={(e: any) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
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
