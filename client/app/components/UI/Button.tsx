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
  id = id ?? `${text}_button`;

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      onSubmit={(e) => e.preventDefault()}
      disabled={disabled || !!loadingId}
      className={`position-relative btn btn-primary ${className}`}
    >
      <span style={loadingId !== id ? {} : { opacity: 0 }}>{text}</span>
      <div
        className={`${
          loadingId !== id ? 'd-none' : ''
        } position-absolute top-0 start-0 h-100 w-100 d-flex justify-content-center align-items-center`}
      >
        <Loading small />
      </div>
    </button>
  );
};

export default Button;
