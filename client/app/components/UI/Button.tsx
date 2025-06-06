import Loading from "~/app/components/UI/Loading.tsx";

type Props = {
  children: React.ReactNode;
  type?: "button" | "submit";
  isLoading?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
};

const Button = ({
  children,
  id,
  type = "button",
  onClick,
  isLoading,
  disabled,
  title,
  className = "",
  style,
  ariaLabel,
}: Props & React.HTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      onSubmit={(e) => e.preventDefault()}
      disabled={disabled || isLoading}
      title={title}
      className={`position-relative btn btn-primary ${className}`}
      style={style}
      aria-label={ariaLabel}
    >
      <span style={isLoading ? { opacity: 0 } : {}}>{children}</span>
      <div
        className={`${
          isLoading ? "" : "d-none"
        } position-absolute top-0 start-0 h-100 w-100 d-flex justify-content-center align-items-center`}
      >
        <Loading small />
      </div>
    </button>
  );
};

export default Button;
