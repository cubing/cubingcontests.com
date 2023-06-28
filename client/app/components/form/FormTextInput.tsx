const FormTextInput = ({
  name,
  id,
  value,
  setValue,
  onKeyDown,
}: {
  name?: string;
  id?: string;
  value: string;
  setValue: any;
  onKeyDown?: (e: any) => void;
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
        type="text"
        id={id}
        value={value}
        onChange={(e: any) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        className="form-control"
      />
    </div>
  );
};

export default FormTextInput;
