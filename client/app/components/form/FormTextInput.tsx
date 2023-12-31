import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
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
  setValue?: (val: any) => void;
  onChange?: (e: any) => void;
  onClick?: (e: any) => void;
  onFocus?: (e: any) => void;
  onBlur?: (e: any) => void;
  onKeyDown?: (e: any) => void;
  nextFocusTargetId?: string;
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
  if (setValue && onChange) throw new Error('setValue and onChange cannot be used at the same time in FormTextInput');

  const [hidePassword, setHidePassword] = useState(password);

  const inputId = id || title;

  const handleFocus = (e: any) => {
    // Prevent the whole input from being highlighted
    e.target.selectionStart = e.target.selectionEnd;
    if (onFocus) onFocus(e);
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
          onKeyDown={(e: any) => genericOnKeyDown(e, { nextFocusTargetId, onKeyDown, submitOnEnter })}
          onClick={onClick}
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
