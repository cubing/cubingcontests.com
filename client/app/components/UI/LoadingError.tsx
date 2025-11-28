type Props = {
  loadingEntity?: string;
};

function LoadingError({ loadingEntity = "data" }: Props) {
  return <h3 className="mt-4 text-center">Error while loading {loadingEntity}</h3>;
}

export default LoadingError;
