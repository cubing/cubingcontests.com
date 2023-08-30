import { MultiChoiceOption } from '~/helpers/interfaces/MultiChoiceOption';

const FormRadio = ({
  title,
  options,
  selected,
  setSelected,
  disabled = false,
}: {
  title: string;
  options: MultiChoiceOption[];
  selected: unknown;
  setSelected: (val: unknown) => void;
  disabled?: boolean;
}) => {
  return (
    <>
      <h5>{title}</h5>

      <div className="my-3 d-flex gap-5">
        {options.map((option) => {
          const id = `radio_${title}_${option.value.toString()}`;

          return (
            <div key={title + option.label + option.value.toString()} className="form-check">
              <input
                id={id}
                type="radio"
                checked={selected === option.value}
                onChange={() => setSelected(option.value)}
                disabled={disabled || option.disabled}
                className="form-check-input"
              />
              <label className="form-check-label" htmlFor={id}>
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default FormRadio;
