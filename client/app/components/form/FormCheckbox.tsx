const FormCheckbox = ({
  title,
  id,
  selected,
  setSelected,
  disabled = false,
}: {
  title?: string;
  id?: string;
  selected: boolean;
  setSelected: (val: boolean) => void;
  disabled?: boolean;
}) => {
  if (!id && !title) {
    throw new Error('Neither title nor id are set in FormCheckbox!');
  }

  const inputId = `${id || title}_checkbox`;

  return (
    <div className="mb-3 form-check">
      <input
        className="form-check-input"
        id={inputId}
        type="checkbox"
        checked={selected}
        onChange={() => setSelected(!selected)}
        disabled={disabled}
      />
      {title && (
        <label className="form-check-label" htmlFor={inputId}>
          {title}
        </label>
      )}
    </div>
  );
};

export default FormCheckbox;
