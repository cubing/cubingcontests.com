import Loading from '@c/UI/Loading';

const Button = ({
  id,
  text,
  type = 'button',
  onClick,
  loadingId,
  disabled,
  className = '',
}: {
  id?: string;
  text: string;
  type?: 'button' | 'submit';
  onClick: () => void;
  loadingId?: string;
  disabled?: boolean;
  className?: string;
}) => {
  return (
    <button
      type={type}
      id={id || `${text}_button`}
      onClick={onClick}
      onSubmit={(e) => e.preventDefault()}
      disabled={disabled || !!loadingId}
      className={`btn btn-primary ${className}`}
    >
      {loadingId !== id ? (
        text
      ) : (
        <div style={{ width: `${(text.length / 2).toFixed(1)}rem` }}>
          <Loading small />
        </div>
      )}
    </button>
  );
};

export default Button;
