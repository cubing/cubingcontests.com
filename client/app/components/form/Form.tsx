const Form = ({
  children,
  buttonText,
  hideButton = false,
  errorMessages,
  handleSubmit,
}: {
  children: React.ReactNode;
  buttonText?: string;
  hideButton?: boolean;
  errorMessages: string[];
  handleSubmit: () => void;
}) => {
  const onSubmit = (e: any) => {
    e.preventDefault();

    handleSubmit();
  };

  return (
    <form className="container my-4 mx-auto px-2 fs-5" style={{ maxWidth: '720px' }} onSubmit={(e: any) => onSubmit(e)}>
      {errorMessages?.map((message, index) => (
        <div key={index} className="alert alert-danger" style={{ whiteSpace: 'pre-wrap' }} role="alert">
          {message}
        </div>
      ))}

      {children}

      {!hideButton && buttonText && (
        <button type="submit" id="form_submit_button" className="d-block mt-4 btn btn-primary">
          {buttonText}
        </button>
      )}
    </form>
  );
};

export default Form;
