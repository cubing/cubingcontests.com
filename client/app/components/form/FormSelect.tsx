import { MultiChoiceOption } from '~/helpers/interfaces/MultiChoiceOption';
import FormInputLabel from './FormInputLabel';

const FormSelect = ({
  id,
  title,
  options,
  selected,
  setSelected,
  disabled = false,
  noMargin = false,
}: {
  id?: string;
  title?: string;
  options: MultiChoiceOption[];
  selected: string | number;
  setSelected: (val: any) => void;
  disabled?: boolean;
  noMargin?: boolean;
}) => {
  let inputId = 'select';

  if (id) inputId = id;
  else if (title) inputId = `${title.toLowerCase().replaceAll(' ', '_')}_select`;

  return (
    <div className={`fs-5 ${noMargin ? '' : ' mb-3'}`}>
      <FormInputLabel text={title} inputId={inputId} />

      <select
        id={inputId}
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
