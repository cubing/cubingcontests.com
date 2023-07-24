const FormTextInput = ({
  name,
  id,
  value,
  placeholder = '',
  disabled = false,
  isPassword = false,
  setValue,
  onKeyPress,
}: {
  name?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  isPassword?: boolean;
  value: string;
  setValue: any;
  onKeyPress?: (e: any) => void;
}) => {
  if (!id && !name) {
    throw new Error('Neither name nor id are set in FormTextInput!');
  }

  return (
    <div className="mb-3 fs-5">
      {name && (
        <label htmlFor={id} className="form-label">
          {name}
        </label>
      )}
      <input
        type={isPassword ? 'password' : 'text'}
        id={id || name}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e: any) => setValue(e.target.value)}
        onKeyPress={onKeyPress}
        className="form-control"
      />
    </div>
  );
};

export default FormTextInput;
