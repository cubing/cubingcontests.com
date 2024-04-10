'use client';

import { useState } from 'react';
import myFetch from '~/helpers/myFetch';
import Form from '@c/form/Form';
import FormTextInput from '@c/form/FormTextInput';

const RequestPasswordResetPage = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingDuringSubmit, setLoadingDuringSubmit] = useState(false);
  const [email, setEmail] = useState('');

  const changeEmail = (newValue: string) => {
    setEmail(newValue);
    setErrorMessages([]);
  };

  const handleSubmit = async () => {
    if (!email) {
      setErrorMessages(['Please enter an email address']);
      document.getElementById('email').focus();
    } else {
      setLoadingDuringSubmit(true);
      setErrorMessages([]);
      setSuccessMessage('');

      const { errors } = await myFetch.post('/auth/request-password-reset', { email }, { authorize: false });

      if (errors) {
        setErrorMessages(errors);
      } else {
        setSuccessMessage('A password reset link will be sent to your email if the entered email address is correct');
      }

      setLoadingDuringSubmit(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-center">Request password reset</h2>

      <Form
        errorMessages={errorMessages}
        successMessage={successMessage}
        onSubmit={handleSubmit}
        disableButton={loadingDuringSubmit}
      >
        <FormTextInput
          id="email"
          title="Email address"
          value={email}
          setValue={changeEmail}
          nextFocusTargetId="form_submit_button"
          autoFocus
        />
      </Form>
    </div>
  );
};

export default RequestPasswordResetPage;
