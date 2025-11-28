import Loading from "~/app/components/UI/Loading.tsx";

type Props = {
  children: React.ReactNode;
  type?: "button" | "submit";
  isLoading?: boolean;
  loadingId?: string;
  disabled?: boolean;
  ariaLabel?: string;
};

function Button({
  children,
  id,
  type = "button",
  onClick,
  isLoading,
  loadingId,
  disabled,
  className = "",
  style,
  title,
  ariaLabel,
}: Props & React.HTMLAttributes<HTMLButtonElement>) {
  const loading = isLoading || (loadingId && loadingId === id);

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      onSubmit={(e) => e.preventDefault()}
      disabled={disabled || isLoading || !!loadingId}
      className={`position-relative btn btn-primary ${className}`}
      style={style}
      title={title}
      aria-label={ariaLabel}
    >
      <span style={loading ? { opacity: 0 } : {}}>{children}</span>
      <div
        className={`${
          loading ? "" : "d-none"
        } position-absolute d-flex justify-content-center start-0 top-0 h-100 w-100 align-items-center`}
      >
        <Loading small />
      </div>
    </button>
  );
}

export default Button;
