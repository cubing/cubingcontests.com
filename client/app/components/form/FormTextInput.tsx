const FormTextInput = ({
  name,
  id,
  value,
  placeholder = '',
  disabled = false,
  password = false,
  setValue,
  onKeyPress,
}: {
  name?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  password?: boolean;
  value: string;
  setValue: any;
  onKeyPress?: (e: any) => void;
}) => {
  if (!id) {
    if (name) {
      id = name?.toLowerCase().replace(' ', '_');
    } else {
      throw new Error('Neither name nor id are set in FormTextInput!');
    }
  }

  return (
    <div className="mb-3 fs-5">
      {name && (
        <label htmlFor={id} className="form-label">
          {name}
        </label>
      )}
      <input
        type={password ? 'password' : 'text'}
        id={id}
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
