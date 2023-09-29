import ErrorMessages from '../ErrorMessages';

const Form = ({
  children,
  buttonText,
  hideButton = false,
  disableButton = false,
  showCancelButton = false,
  errorMessages,
  successMessage,
  onSubmit,
  onCancel,
}: {
  children: React.ReactNode;
  buttonText?: string;
  hideButton?: boolean;
  disableButton?: boolean;
  showCancelButton?: boolean;
  errorMessages: string[];
  successMessage?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
}) => {
  const showSubmitButton = !hideButton && buttonText;
  if (showSubmitButton && !onSubmit) throw new Error('onSubmit cannot be undefined unless the submit button is hidden');
  if (showCancelButton && !onCancel) throw new Error('onCancel cannot be undefined unless the cancel button is hidden');

  return (
    <form
      className="container my-4 mx-auto px-3 fs-5"
      style={{ maxWidth: '768px' }}
      onSubmit={(e: any) => e.preventDefault()}
    >
      {errorMessages.length > 0 ? (
        <ErrorMessages errorMessages={errorMessages} />
      ) : (
        successMessage && <div className="mb-3 alert alert-success fs-5">{successMessage}</div>
      )}

      {children}

      {(showSubmitButton || showCancelButton) && (
        <div className="d-flex gap-3 mt-4">
          {showSubmitButton && (
            <button
              type="submit"
              id="form_submit_button"
              className="btn btn-primary"
              disabled={disableButton}
              onClick={onSubmit}
              onSubmit={(e) => e.preventDefault()}
            >
              {buttonText}
            </button>
          )}
          {showCancelButton && (
            <button type="button" className="btn btn-danger" disabled={disableButton} onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      )}
    </form>
  );
};

export default Form;
