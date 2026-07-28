import Tooltip from "~/app/components/UI/Tooltip.tsx";

type Props = {
  text?: string;
  inputId: string;
  tooltip?: string;
} & React.HTMLAttributes<HTMLLabelElement>;

function FormInputLabel({ text, inputId, tooltip, className }: Props) {
  return (
    <span className="d-flex flex-shrink-0 gap-2 align-items-start">
      {/* form-label adds a slight bottom margin */}
      <label htmlFor={inputId} className={`form-label fw-semibold ${className}`}>
        {text}
      </label>

      {tooltip && <Tooltip id={`${inputId}_tooltip`} text={tooltip} />}
    </span>
  );
}

export default FormInputLabel;
