'use client';

import { useContext, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import myFetch from '~/helpers/myFetch';
import Form from '@c/form/Form';
import FormTextInput from '@c/form/FormTextInput';
import Button from '@c/UI/Button';
import { MainContext } from '~/helpers/contexts';

const ConfirmEmailPage = () => {
  const searchParams = useSearchParams();
  const { setErrorMessages, setSuccessMessage, loadingId, setLoadingId, resetMessagesAndLoadingId } =
    useContext(MainContext);

  const [code, setCode] = useState('');

  const handleSubmit = async () => {
    resetMessagesAndLoadingId();
    setLoadingId('form_submit_button');

    const username = searchParams.get('username');
    const { errors } = await myFetch.post('/auth/confirm-email', { username, code }, { authorize: false });

    if (errors) {
      setErrorMessages(errors);
      setLoadingId('');
      document.getElementById('confirmation_code')?.focus();
    } else {
      setSuccessMessage('Your account has been verified');

      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }
  };

  const resendCode = async () => {
    resetMessagesAndLoadingId();
    setLoadingId('resend_code_button');

    const { errors } = await myFetch.post(
      '/auth/resend-confirmation-code',
      { username: searchParams.get('username') },
      { authorize: false },
    );

    if (errors) {
      setErrorMessages(errors);
    } else {
      setSuccessMessage('A new confirmation code has been sent');
      setCode('');
    }

    setLoadingId('');
    document.getElementById('confirmation_code')?.focus();
  };

  return (
    <div>
      <h2 className="mb-4 text-center">Confirm Email</h2>

      <Form buttonText="Confirm" onSubmit={handleSubmit}>
        <FormTextInput
          id="confirmation_code"
          title="Confirmation code"
          value={code}
          setValue={setCode}
          nextFocusTargetId="form_submit_button"
          autoFocus
        />
        <Button
          id="resend_code_button"
          text="Resend code"
          onClick={resendCode}
          loadingId={loadingId}
          className="btn-secondary btn-sm"
        />
      </Form>
    </div>
  );
};

export default ConfirmEmailPage;
