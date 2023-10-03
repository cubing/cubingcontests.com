import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import FormInputLabel from './FormInputLabel';

const FormTextInput = ({
  id,
  title,
  placeholder = '',
  tooltip,
  value,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  autoFocus = false,
  required = false,
  disabled = false,
  submitOnEnter = false,
  password = false,
  monospace = false,
  invalid = false,
  noMargin = false,
}: {
  id?: string;
  title?: string;
  placeholder?: string;
  tooltip?: string;
  value: string;
  onChange: (val: any) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: any) => void;
  autoFocus?: boolean;
  required?: boolean;
  disabled?: boolean;
  password?: boolean;
  monospace?: boolean;
  submitOnEnter?: boolean;
  invalid?: boolean;
  noMargin?: boolean;
}) => {
  if (!id && !title) throw new Error('Neither title nor id are set in FormTextInput');

  const [hidePassword, setHidePassword] = useState(password);

  const inputId = id || title;

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter' && !submitOnEnter) e.preventDefault();
    if (onKeyDown) onKeyDown(e);
  };

  const handleFocus = (e: any) => {
    // Prevent the whole input from being highlighted
    e.target.selectionStart = e.target.selectionEnd;
    if (onFocus) onFocus();
  };

  return (
    <div className={'fs-5' + (noMargin ? '' : ' mb-3')}>
      {title && <FormInputLabel text={title} inputId={inputId} tooltip={tooltip} />}
      <div className="d-flex justify-content-between align-items-center gap-3">
        <input
          type={hidePassword ? 'password' : 'text'}
          id={inputId}
          value={value}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          required={required}
          onChange={(e: any) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={(e: any) => handleFocus(e)}
          onBlur={onBlur}
          className={'form-control flex-grow-1' + (monospace ? ' font-monospace' : '') + (invalid ? ' is-invalid' : '')}
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
