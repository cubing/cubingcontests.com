type Props = {
  id?: string;
  title?: string;
  checked: boolean;
  setChecked: (val: boolean) => void;
  disabled?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

function FormCheckbox({ id, title, checked, setChecked, disabled = false, className }: Props) {
  if (!id && !title) throw new Error("Neither title nor id are set in FormCheckbox!");

  const inputId = `${id || title}_checkbox`;

  return (
    <div className={`form-check ${className}`}>
      <input
        className="form-check-input"
        id={inputId}
        type="checkbox"
        checked={checked}
        onChange={() => setChecked(!checked)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
        disabled={disabled}
      />
      {title && (
        <label className="form-check-label ms-1" htmlFor={inputId}>
          {title}
        </label>
      )}
    </div>
  );
}

export default FormCheckbox;
