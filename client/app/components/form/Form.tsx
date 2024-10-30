"use client";

import { useContext } from "react";
import { MainContext } from "~/helpers/contexts.ts";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import Button from "~/app/components/UI/Button.tsx";

type Props = {
  children: React.ReactNode;
  buttonText?: string;
  hideToasts?: boolean;
  hideButton?: boolean;
  disableButton?: boolean;
  showCancelButton?: boolean;
  onSubmit?: () => void;
  onCancel?: () => void;
};

const Form = ({
  children,
  buttonText = "Submit",
  hideToasts,
  hideButton,
  disableButton,
  showCancelButton,
  onSubmit,
  onCancel,
}: Props) => {
  const showSubmitButton = !hideButton && buttonText;
  if (showSubmitButton && !onSubmit) throw new Error("onSubmit cannot be undefined unless the submit button is hidden");
  if (showCancelButton && !onCancel) throw new Error("onCancel cannot be undefined unless the cancel button is hidden");

  const { loadingId } = useContext(MainContext);

  return (
    <form
      className="container my-4 mx-auto px-3 fs-5"
      style={{ maxWidth: "768px" }}
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
              loadingId={loadingId}
              disabled={disableButton}
            >
              {buttonText}
            </Button>
          )}
          {showCancelButton && (
            <Button
              id="form_cancel_button"
              onClick={onCancel}
              loadingId={loadingId}
              disabled={disableButton}
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
