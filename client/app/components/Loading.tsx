const Loading = () => {
  return (
    <div className="d-flex justify-content-center">
      <div className="spinner-border" style={{ marginTop: '5rem', width: '4rem', height: '4rem' }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

export default Loading;
