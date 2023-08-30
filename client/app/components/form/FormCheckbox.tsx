const FormCheckbox = ({
  title,
  id,
  selected,
  setSelected,
}: {
  title?: string;
  id?: string;
  selected: boolean;
  setSelected: (val: unknown) => void;
}) => {
  if (!id && !title) {
    throw new Error('Neither title nor id are set in FormCheckbox!');
  }

  const inputId = `${id || title}_checkbox`;

  return (
    <div className="form-check">
      <input className="form-check-input" type="checkbox" checked={selected} onChange={setSelected} id={inputId} />
      {title && (
        <label className="form-check-label" htmlFor={inputId}>
          {title}
        </label>
      )}
    </div>
  );
};

export default FormCheckbox;
