import { MultiChoiceOption } from '~/helpers/interfaces/MultiChoiceOption';

const FormSelect = ({
  title,
  options,
  selected,
  setSelected,
  disabled = false,
  noMargin = false,
}: {
  title?: string;
  options: MultiChoiceOption[];
  selected: string | number;
  setSelected: (val: any) => void;
  disabled?: boolean;
  noMargin?: boolean;
}) => {
  const id = `select_${title.toLowerCase().replaceAll(' ', '_')}`;

  return (
    <div className={'fs-5' + (noMargin ? '' : ' mb-3')}>
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
