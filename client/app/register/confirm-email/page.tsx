'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Form from '@c/form/Form';
import FormTextInput from '@c/form/FormTextInput';
import myFetch from '~/helpers/myFetch';

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
      setSuccessMessage('Your account has been confirmed');

      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }
  };

  // const resendCode = () => {
  //   setLoadingDuringSubmit(true);
  // };

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
        {/* <Button
            text="Resend code"
            onClick={resendCode}
            loading={loadingDuringSubmit}
            className="btn-secondary btn-sm p-1"
          /> */}
      </Form>
    </div>
  );
};

export default ConfirmEmailPage;
