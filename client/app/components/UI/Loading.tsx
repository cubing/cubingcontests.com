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

  const height = small ? '1.5rem' : '4rem';
  const width = small ? '1.5rem' : '4rem';

  return (
    <div className={dontCenter ? 'ms-2 d-inline' : 'd-flex justify-content-center'} style={{ height }}>
      <div
        className="position-absolute spinner-border text-white"
        style={{ marginTop: small ? '0' : '5rem', width, height }}
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

export default Loading;
