'use client';

import { useContext, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMyFetch } from '~/helpers/customHooks';
import Form from '@c/form/Form';
import FormTextInput from '@c/form/FormTextInput';
import Button from '@c/UI/Button';
import { MainContext } from '~/helpers/contexts';

const ConfirmEmailPage = () => {
  const searchParams = useSearchParams();
  const myFetch = useMyFetch();
  const { changeSuccessMessage, loadingId } = useContext(MainContext);

  const [code, setCode] = useState('');

  const handleSubmit = async () => {
    const username = searchParams.get('username');
    const { errors } = await myFetch.post(
      '/auth/confirm-email',
      { username, code },
      { authorize: false, loadingId: 'form_submit_button' },
    );

    if (errors) {
      document.getElementById('confirmation_code')?.focus();
    } else {
      changeSuccessMessage('Your account has been verified');

      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }
  };

  const resendCode = async () => {
    const { errors } = await myFetch.post(
      '/auth/resend-confirmation-code',
      { username: searchParams.get('username') },
      { authorize: false, loadingId: 'resend_code_button' },
    );

    if (!errors) {
      changeSuccessMessage('A new confirmation code has been sent');
      setCode('');
    }

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
