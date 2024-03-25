'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import myFetch from '~/helpers/myFetch';
import Form from '@c/form/Form';
import FormTextInput from '@c/form/FormTextInput';
import Button from '@c/Button';

const ConfirmEmailPage = () => {
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [loadingDuringSubmit, setLoadingDuringSubmit] = useState(false);

  const searchParams = useSearchParams();

  const handleSubmit = async () => {
    setLoadingDuringSubmit(true);
    setErrorMessages([]);

    const username = searchParams.get('username');
    const { errors } = await myFetch.post('/auth/confirm-email', { username, code }, { authorize: false });

    if (errors) {
      setErrorMessages(errors);
      setLoadingDuringSubmit(false);
    } else {
      setSuccessMessage('Your account has been verified');

      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }
  };

  const resendCode = async () => {
    setLoadingDuringSubmit(true);
    setErrorMessages([]);
    setCode('');

    const { errors } = await myFetch.post(
      '/auth/resend-confirmation-code',
      { username: searchParams.get('username') },
      { authorize: false },
    );

    if (errors) {
      setErrorMessages(errors);
    } else {
      setSuccessMessage('A new confirmation code has been sent');
    }

    setLoadingDuringSubmit(false);
  };

  return (
    <div>
      <h2 className="mb-4 text-center">Confirm Email</h2>

      <Form
        buttonText="Continue"
        successMessage={successMessage}
        errorMessages={errorMessages}
        onSubmit={handleSubmit}
        disableButton={loadingDuringSubmit}
      >
        <FormTextInput
          title="Confirmation code"
          value={code}
          setValue={setCode}
          nextFocusTargetId="form_submit_button"
          autoFocus
        />
        <Button
          text="Resend code"
          onClick={resendCode}
          loading={loadingDuringSubmit}
          className="btn-secondary btn-sm"
        />
      </Form>
    </div>
  );
};

export default ConfirmEmailPage;
