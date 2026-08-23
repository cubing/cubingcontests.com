import Tooltip from "~/app/components/UI/Tooltip.tsx";

type Props = {
  text?: string;
  inputId: string;
  tooltip?: string;
  optional?: boolean;
} & React.HTMLAttributes<HTMLLabelElement>;

function FormInputLabel({ text, inputId, tooltip, optional, className }: Props) {
  return (
    <span className="d-flex flex-shrink-0 gap-2 align-items-start">
      {/* form-label adds a slight bottom margin */}
      <label htmlFor={inputId} className={`form-label tw:font-semibold ${className}`}>
        {text}
        {optional && <span className="tw:ms-1.5 tw:font-normal text-muted tw:text-sm">(optional)</span>}
      </label>

      {tooltip && <Tooltip id={`${inputId}_tooltip`} text={tooltip} />}
    </span>
  );
}

export default FormInputLabel;
