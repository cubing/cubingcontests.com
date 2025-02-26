"use client";

import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import Button from "~/app/components/UI/Button.tsx";

type Props = {
  children: React.ReactNode;
  buttonText?: string;
  hideToasts?: boolean;
  hideControls?: boolean;
  disableControls?: boolean;
  showCancelButton?: boolean;
  isLoading?: boolean;
  onSubmit?: () => void;
  onCancel?: () => void;
};

const Form = ({
  children,
  buttonText = "Submit",
  hideToasts,
  hideControls,
  disableControls,
  showCancelButton,
  isLoading,
  onSubmit,
  onCancel,
}: Props) => {
  const showSubmitButton = !hideControls && buttonText;
  if (showSubmitButton && !onSubmit) {
    throw new Error(
      "onSubmit cannot be undefined unless the submit button is hidden",
    );
  }
  if (showCancelButton && !onCancel) {
    throw new Error(
      "onCancel cannot be undefined unless the cancel button is hidden",
    );
  }

  const controlsDisabled = disableControls || isLoading;

  return (
    <form
      className="container my-4 mx-auto px-3 fs-5"
      style={{ maxWidth: "var(--cc-md-width)" }}
      onSubmit={(e) => e.preventDefault()}
    >
      {!hideToasts && <ToastMessages />}

      {children}

      {(showSubmitButton || showCancelButton) && (
        <div className="d-flex gap-3 mt-4">
          {showSubmitButton && (
            <Button
              id="form_submit_button"
              type="submit"
              onClick={onSubmit}
              disabled={controlsDisabled}
              isLoading={isLoading}
            >
              {buttonText}
            </Button>
          )}
          {showCancelButton && (
            <Button
              id="form_cancel_button"
              onClick={onCancel}
              disabled={controlsDisabled}
              className="btn-danger"
            >
              Cancel
            </Button>
          )}
        </div>
      )}
    </form>
  );
};

export default Form;
