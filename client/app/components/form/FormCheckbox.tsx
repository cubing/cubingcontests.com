const FormCheckbox = ({
  id,
  title,
  selected,
  setSelected,
  disabled = false,
  noMargin = false,
  small = false,
}: {
  id?: string;
  title?: string;
  selected: boolean;
  setSelected: (val: boolean) => void;
  disabled?: boolean;
  noMargin?: boolean;
  small?: boolean;
}) => {
  if (!id && !title) {
    throw new Error('Neither title nor id are set in FormCheckbox!');
  }

  const inputId = `${id || title}_checkbox`;

  return (
    <div className={`form-check ${noMargin ? '' : ' mb-3'}`}>
      <input
        className='form-check-input'
        id={inputId}
        type='checkbox'
        checked={selected}
        onChange={() => setSelected(!selected)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault();
        }}
        disabled={disabled}
      />
      {title && (
        <label
          className={`form-check-label ${small ? 'fs-6' : 'fs-5'}`}
          htmlFor={inputId}
        >
          {title}
        </label>
      )}
    </div>
  );
};

export default FormCheckbox;
