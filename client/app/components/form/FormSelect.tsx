import { MultiChoiceOption } from "~/helpers/types.ts";
import FormInputLabel from "./FormInputLabel.tsx";

type Props = {
  title?: string;
  options: MultiChoiceOption[];
  selected: string | number;
  setSelected: (val: any) => void;
  disabled?: boolean;
  oneLine?: boolean;
};

const FormSelect = ({
  id,
  title,
  options,
  selected,
  setSelected,
  disabled,
  oneLine,
  className = "",
  style,
}: Props & React.HTMLAttributes<HTMLElement>) => {
  let inputId = "select";

  if (id) inputId = id;
  else if (title) inputId = `${title.toLowerCase().replaceAll(" ", "_")}_select`;

  return (
    <div className={`fs-5 ${oneLine ? "d-flex align-items-center gap-3" : ""} ${className}`} style={style}>
      <FormInputLabel text={title} inputId={inputId} />

      <select
        id={inputId}
        value={selected}
        onChange={(e) => setSelected(typeof selected === "string" ? e.target.value : Number(e.target.value))}
        disabled={disabled}
        className={`form-select ${oneLine ? "mb-2" : ""}`} // mb-2 is to offset the bottom margin of the label
      >
        {options.map((option: MultiChoiceOption) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
};

export default FormSelect;
