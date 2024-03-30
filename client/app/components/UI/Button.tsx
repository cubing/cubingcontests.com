import Loading from '@c/UI/Loading';

const Button = ({
  text,
  id,
  onClick,
  disabled = false,
  loading = false,
  className = '',
}: {
  text: string;
  id?: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) => {
  return (
    <button
      type="button"
      id={id || `${text}_button`}
      onClick={onClick}
      disabled={loading || disabled}
      className={`btn btn-primary ${className}`}
    >
      {!loading ? (
        text
      ) : (
        <div style={{ width: '3.3rem' }}>
          <Loading small />
        </div>
      )}
    </button>
  );
};

export default Button;
