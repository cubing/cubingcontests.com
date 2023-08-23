const Loading = ({ errorMessages }: { errorMessages?: string[] }) => {
  if (errorMessages?.length > 0) {
    return <p className="mt-5 text-center fs-4">{errorMessages[0]}</p>;
  }

  return (
    <div className="d-flex justify-content-center">
      <div className="spinner-border" style={{ marginTop: '5rem', width: '4rem', height: '4rem' }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

export default Loading;
