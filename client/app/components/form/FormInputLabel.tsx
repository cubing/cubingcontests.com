import Tooltip from "~/app/components/UI/Tooltip.tsx";

const FormInputLabel = (
  { text, inputId, tooltip }: {
    text: string;
    inputId: string;
    tooltip?: string;
  },
) => {
  if (text) {
    return (
      <span className="flex-shrink-0 d-flex align-items-center gap-2">
        <label htmlFor={inputId} className="form-label">
          {text}
        </label>
        {tooltip && (
          <span className="mb-2">
            <Tooltip id={`${inputId}_tooltip`} text={tooltip} />
          </span>
        )}
      </span>
    );
  }
};

export default FormInputLabel;
