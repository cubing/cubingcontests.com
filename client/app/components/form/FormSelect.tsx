import type { MultiChoiceOption, OptionValueType } from "~/helpers/types/MultiChoiceOption.ts";
import FormInputLabel from "./FormInputLabel.tsx";

type Props = {
  title?: string;
  options: MultiChoiceOption[];
  selected: OptionValueType;
  setSelected: (val: OptionValueType) => void;
  disabled?: boolean;
  oneLine?: boolean;
} & React.HTMLAttributes<HTMLElement>;

function FormSelect({ id, title, options, selected, setSelected, disabled, oneLine, className = "", style }: Props) {
  const value = selected === null ? "" : selected;
  const inputId = id || (title ? `${title.toLowerCase().replaceAll(" ", "_")}_select` : "select");

  return (
    <div className={`fs-5 ${oneLine ? "d-flex gap-3 align-items-center" : ""} ${className}`} style={style}>
      {title && <FormInputLabel text={title} inputId={inputId} />}

      <select
        id={inputId}
        value={value}
        onChange={(e) => setSelected(typeof value === "string" ? e.target.value || null : Number(e.target.value))}
        disabled={disabled}
        className="form-select"
      >
        {options
          .filter((o) => !o.disabled)
          .map((option) => (
            <option key={option.value} value={option.value ?? ""}>
              {option.label}
            </option>
          ))}
      </select>
    </div>
  );
}

export default FormSelect;
