import Tooltip from "~/app/components/UI/Tooltip.tsx";

type Props = {
  text?: string;
  inputId: string;
  tooltip?: string;
};

function FormInputLabel({ text, inputId, tooltip }: Props) {
  return (
    <span className="d-flex flex-shrink-0 gap-2 align-items-start">
      <label htmlFor={inputId} className="form-label fs-5">
        {text}
      </label>

      {tooltip && (
        <span className="mt-1">
          <Tooltip id={`${inputId}_tooltip`} text={tooltip} />
        </span>
      )}
    </span>
  );
}

export default FormInputLabel;
