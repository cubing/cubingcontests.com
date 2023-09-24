const Loading = ({
  errorMessages,
  small = false,
  dontCenter = false,
}: {
  errorMessages?: string[];
  small?: boolean;
  dontCenter?: boolean;
}) => {
  if (errorMessages?.length > 0) {
    return <p className="mt-5 text-center fs-4">{errorMessages[0]}</p>;
  }

  return (
    <div className={dontCenter ? `ms-2 d-inline` : `d-flex justify-content-center`}>
      <div
        className="spinner-border"
        style={{ marginTop: small ? `0` : `5rem`, width: small ? `1.5rem` : `4rem`, height: small ? `1.5rem` : `4rem` }}
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

export default Loading;
