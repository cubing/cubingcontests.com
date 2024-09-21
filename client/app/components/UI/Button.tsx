import Loading from '@c/UI/Loading';

const Button = ({
  children,
  id,
  type = 'button',
  onClick,
  loadingId,
  disabled,
  className = '',
  style,
  ariaLabel,
}: {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  loadingId?: string;
  disabled?: boolean;
  ariaLabel?: string;
} & React.HTMLAttributes<HTMLButtonElement>) => {
  const isLoading = loadingId && loadingId === id;

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      onSubmit={(e) => e.preventDefault()}
      disabled={disabled || !!loadingId}
      className={`position-relative btn btn-primary ${className}`}
      style={style}
      aria-label={ariaLabel}
    >
      <span style={isLoading ? { opacity: 0 } : {}}>{children}</span>
      <div
        className={`${
          isLoading ? '' : 'd-none'
        } position-absolute top-0 start-0 h-100 w-100 d-flex justify-content-center align-items-center`}
      >
        <Loading small />
      </div>
    </button>
  );
};

export default Button;
