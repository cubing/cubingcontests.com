'use client';

import React, { useContext, useState } from 'react';
import { useMyFetch } from '~/helpers/customHooks.ts';
import Form from '~/app/components/form/Form.tsx';
import FormTextInput from '~/app/components/form/FormTextInput.tsx';
import { MainContext } from '~/helpers/contexts.ts';

const RequestPasswordResetPage = () => {
  const myFetch = useMyFetch();
  const {
    changeErrorMessages,
    changeSuccessMessage,
    resetMessagesAndLoadingId,
  } = useContext(MainContext);

  const [email, setEmail] = useState('');

  const changeEmail = (newValue: string) => {
    resetMessagesAndLoadingId();
    setEmail(newValue);
  };

  const handleSubmit = async () => {
    if (!email) {
      changeErrorMessages(['Please enter an email address']);
      document.getElementById('email').focus();
    } else {
      const { errors } = await myFetch.post(
        '/auth/request-password-reset',
        { email },
        { authorize: false, loadingId: 'form_submit_button' },
      );

      if (!errors) {
        changeSuccessMessage(
          'A password reset link will be sent to your email if the entered email address is correct',
        );
      }
    }
  };

  return (
    <div>
      <h2 className='mb-4 text-center'>Request password reset</h2>

      <Form onSubmit={handleSubmit}>
        <FormTextInput
          id='email'
          title='Email address'
          value={email}
          setValue={changeEmail}
          nextFocusTargetId='form_submit_button'
          autoFocus
        />
      </Form>
    </div>
  );
};

export default RequestPasswordResetPage;
