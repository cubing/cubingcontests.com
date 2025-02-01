import Tooltip from "~/app/components/UI/Tooltip.tsx";

type Props = {
  text?: string;
  inputId: string;
  tooltip?: string;
};

const FormInputLabel = ({ text, inputId, tooltip }: Props) => {
  return (
    <span className="flex-shrink-0 d-flex align-items-start gap-2">
      <label htmlFor={inputId} className="form-label mb-0">{text}</label>

      {tooltip && (
        <span className="mt-1">
          <Tooltip id={`${inputId}_tooltip`} text={tooltip} />
        </span>
      )}
    </span>
  );
};

export default FormInputLabel;
