'use client';

import ToastMessages from '@c/UI/ToastMessages';
import Button from '@c/UI/Button';
import { useContext } from 'react';
import { MainContext } from '~/helpers/contexts';

const Form = ({
  children,
  buttonText = 'Submit',
  hideToasts,
  hideButton,
  disableButton,
  showCancelButton,
  onSubmit,
  onCancel,
}: {
  children: React.ReactNode;
  buttonText?: string;
  hideToasts?: boolean;
  hideButton?: boolean;
  disableButton?: boolean;
  showCancelButton?: boolean;
  onSubmit?: () => void;
  onCancel?: () => void;
}) => {
  const showSubmitButton = !hideButton && buttonText;
  if (showSubmitButton && !onSubmit) throw new Error('onSubmit cannot be undefined unless the submit button is hidden');
  if (showCancelButton && !onCancel) throw new Error('onCancel cannot be undefined unless the cancel button is hidden');

  const { loadingId } = useContext(MainContext);

  return (
    <form
      className="container my-4 mx-auto px-3 fs-5"
      style={{ maxWidth: '768px' }}
      onSubmit={(e) => e.preventDefault()}
    >
      {!hideToasts && <ToastMessages />}

      {children}

      {(showSubmitButton || showCancelButton) && (
        <div className="d-flex gap-3 mt-4">
          {showSubmitButton && (
            <Button
              id="form_submit_button"
              text={buttonText}
              type="submit"
              onClick={onSubmit}
              loadingId={loadingId}
              disabled={disableButton}
              className="btn btn-primary"
            />
          )}
          {showCancelButton && (
            <Button
              id="form_cancel_button"
              text="Cancel"
              onClick={onCancel}
              loadingId={loadingId}
              disabled={disableButton}
              className="btn btn-danger"
            />
          )}
        </div>
      )}
    </form>
  );
};

export default Form;
