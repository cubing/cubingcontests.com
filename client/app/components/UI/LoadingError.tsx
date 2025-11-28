type Props = {
  loadingEntity?: string;
  reason?: string;
};

function LoadingError({ loadingEntity = "data", reason }: Props) {
  return (
    <div>
      <h3 className="mt-4 text-center">Error while loading {loadingEntity}</h3>
      {reason && <p className="mt-4 text-center">(reason: {reason})</p>}
    </div>
  );
}

export default LoadingError;
