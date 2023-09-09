import { MultiChoiceOption } from '~/helpers/interfaces/MultiChoiceOption';

const FormSelect = ({
  title,
  options,
  selected,
  setSelected,
  disabled = false,
}: {
  title?: string;
  options: MultiChoiceOption[];
  selected: string | number;
  setSelected: (val: any) => void;
  disabled?: boolean;
}) => {
  const id = `select_${title.toLowerCase().replaceAll(' ', '_')}`;

  return (
    <div className="mb-3 fs-5">
      {title && (
        <label htmlFor={id} className="form-label">
          {title}
        </label>
      )}
      <select
        id={id}
        className="form-select"
        value={selected}
        onChange={(e) => setSelected(typeof selected === 'string' ? e.target.value.toString() : Number(e.target.value))}
        disabled={disabled}
      >
        {options.map((option: MultiChoiceOption) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FormSelect;
