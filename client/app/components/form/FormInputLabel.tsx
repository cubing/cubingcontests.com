import Tooltip from '@c/UI/Tooltip';

const FormInputLabel = ({ text, inputId, tooltip }: { text: string; inputId: string; tooltip?: string }) => {
  if (text) {
    return (
      <span className="d-flex align-items-center gap-2 mb-2">
        <label htmlFor={inputId} className="form-label mb-1">
          {text}
        </label>
        {tooltip && <Tooltip id={`${inputId}_tooltip`} text={tooltip} />}
      </span>
    );
  }
};

export default FormInputLabel;
