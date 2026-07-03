"use client";

import Button from "~/app/components/UI/Button.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";

type Props = {
  children: React.ReactNode;
  hideToasts?: boolean;
  isLoading?: boolean;
  disableControls?: boolean;
  onCancel?: () => void;
} & (
  | {
      buttonText?: string;
      hideSubmitButton?: boolean;
      onSubmit: () => void;
      submitButtonSuccessStyle?: boolean;
    }
  | {
      buttonText?: never;
      hideSubmitButton: true;
      onSubmit?: never;
      submitButtonSuccessStyle?: never;
    }
) &
  React.HTMLAttributes<HTMLFormElement>;

function Form({
  children,
  buttonText = "Submit",
  hideToasts = false,
  hideSubmitButton = false,
  isLoading = false,
  disableControls = false,
  onSubmit,
  submitButtonSuccessStyle = false,
  onCancel,
  className,
}: Props) {
  const controlsDisabled = disableControls || isLoading;

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className={`container mx-auto my-4 px-3 ${className}`}
      style={{ maxWidth: "var(--rr-md-width)" }}
    >
      {!hideToasts && <ToastMessages />}

      {children}

      {(!hideSubmitButton || onCancel) && (
        <div className="d-flex mt-3 gap-3">
          {!hideSubmitButton && (
            <Button
              id="form_submit_button"
              type="submit"
              onClick={onSubmit}
              disabled={controlsDisabled}
              isLoading={isLoading}
              className={submitButtonSuccessStyle ? "btn-success" : "btn-primary"}
            >
              {buttonText}
            </Button>
          )}
          {onCancel && (
            <Button id="form_cancel_button" onClick={onCancel} disabled={controlsDisabled} className="btn-danger">
              Cancel
            </Button>
          )}
        </div>
      )}
    </form>
  );
}

export default Form;
