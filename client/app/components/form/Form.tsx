import ErrorMessages from '../ErrorMessages';

const Form = ({
  children,
  buttonText,
  hideButton = false,
  disableButton = false,
  errorMessages,
  successMessage,
  handleSubmit,
}: {
  children: React.ReactNode;
  buttonText?: string;
  hideButton?: boolean;
  disableButton?: boolean;
  errorMessages: string[];
  successMessage?: string;
  handleSubmit?: () => void;
}) => {
  return (
    <form
      className="container my-4 mx-auto px-2 fs-5"
      style={{ maxWidth: `720px` }}
      onSubmit={(e: any) => e.preventDefault()}
    >
      {errorMessages.length > 0 ? (
        <ErrorMessages errorMessages={errorMessages} />
      ) : (
        successMessage && <div className="mb-3 alert alert-success fs-5">{successMessage}</div>
      )}

      {children}

      {!hideButton && buttonText && (
        <button
          type="submit"
          id="form_submit_button"
          className="d-block mt-4 btn btn-primary"
          disabled={disableButton}
          onClick={handleSubmit}
          onSubmit={(e) => e.preventDefault()}
        >
          {buttonText}
        </button>
      )}
    </form>
  );
};

export default Form;
