import { MultiChoiceOption } from "~/helpers/types.ts";

type Props = {
  id?: string;
  title: string;
  options: MultiChoiceOption[];
  selected: any;
  setSelected: (val: any) => void;
  disabled?: boolean;
  oneLine?: boolean;
  small?: boolean;
};

const FormRadio = ({
  id,
  title,
  options,
  selected,
  setSelected,
  disabled = false,
  oneLine = false,
  small = false,
}: Props) => {
  return (
    <div
      className={`${oneLine ? "d-flex flex-wrap align-items-center gap-3 gap-md-5" : ""}  ${small ? "fs-6" : "fs-5"}`}
    >
      <h5 className={`${oneLine ? "m-0" : ""}  ${small ? "fs-6" : "fs-5"}`}>{title}</h5>

      <div className={`d-flex flex-wrap gap-3 gap-md-4 ${oneLine ? "" : "my-3"}`}>
        {options.map((option) => {
          const uniqueId = `radio_${id || title}_${option.value}`;

          return (
            <div key={uniqueId} className="form-check">
              <input
                id={uniqueId}
                type="radio"
                checked={selected === option.value}
                onChange={() => setSelected(option.value)}
                disabled={disabled || option.disabled}
                className="form-check-input"
              />
              <label className="form-check-label" htmlFor={uniqueId}>{option.label}</label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FormRadio;
