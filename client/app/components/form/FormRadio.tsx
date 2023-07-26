import { MultiChoiceOption } from '~/helpers/interfaces/MultiChoiceOption';

const FormRadio = ({
  title,
  options,
  selected,
  setSelected,
}: {
  title: string;
  options: MultiChoiceOption[];
  selected: unknown;
  setSelected: (value: any) => void;
}) => {
  return (
    <>
      <h5>{title}</h5>

      <div className="my-3 d-flex gap-5">
        {options.map((option) => {
          const id = Math.random().toString();

          return (
            <div key={option.value.toString()} className="form-check">
              <input
                id={id}
                type="radio"
                checked={selected === option.value}
                onChange={() => setSelected(option.value)}
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
