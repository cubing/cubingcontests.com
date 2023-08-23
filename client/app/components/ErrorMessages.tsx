const ErrorMessages = ({ errorMessages }: { errorMessages: string[] }) => {
  return errorMessages.map((message, index) => (
    <div key={index} className="alert alert-danger" style={{ whiteSpace: 'pre-wrap' }} role="alert">
      {message}
    </div>
  ));
};

export default ErrorMessages;
