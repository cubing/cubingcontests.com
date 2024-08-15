'use client';

import { useContext, useState } from 'react';
import myFetch from '~/helpers/myFetch';
import Form from '@c/form/Form';
import FormTextInput from '@c/form/FormTextInput';
import { MainContext } from '~/helpers/contexts';

const RequestPasswordResetPage = () => {
  const { setErrorMessages, setSuccessMessage, setLoadingId, resetMessagesAndLoadingId } = useContext(MainContext);

  const [email, setEmail] = useState('');

  const changeEmail = (newValue: string) => {
    setEmail(newValue);
    resetMessagesAndLoadingId();
  };

  const handleSubmit = async () => {
    if (!email) {
      setErrorMessages(['Please enter an email address']);
      document.getElementById('email').focus();
    } else {
      resetMessagesAndLoadingId();
      setLoadingId('form_submit_button');

      const { errors } = await myFetch.post('/auth/request-password-reset', { email }, { authorize: false });

      if (errors) setErrorMessages(errors);
      else
        setSuccessMessage('A password reset link will be sent to your email if the entered email address is correct');

      setLoadingId('');
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-center">Request password reset</h2>

      <Form onSubmit={handleSubmit}>
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
