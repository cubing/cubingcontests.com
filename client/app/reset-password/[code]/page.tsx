'use client';

import { useContext, useState } from 'react';
import myFetch from '~/helpers/myFetch';
import Form from '@c/form/Form';
import FormTextInput from '@c/form/FormTextInput';
import { MainContext } from '~/helpers/contexts';

const ResetPasswordPage = ({ params: { code } }: { params: { code: string } }) => {
  const { setErrorMessages, setSuccessMessage, setLoadingId, resetMessagesAndLoadingId } = useContext(MainContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');

  const handleSubmit = async () => {
    const tempErrors: string[] = [];

    if (!password) tempErrors.push('Please enter a password');
    else if (!passwordRepeat) tempErrors.push('Please confirm your password');
    else if (passwordRepeat !== password) tempErrors.push('The entered passwords do not match');

    if (tempErrors.length > 0) {
      setErrorMessages(tempErrors);
    } else {
      resetMessagesAndLoadingId();
      setLoadingId('form_submit_button');

      const { errors } = await myFetch.post(
        '/auth/reset-password',
        { email, code, newPassword: password },
        { authorize: false },
      );

      if (errors) {
        setErrorMessages(errors);
      } else {
        setSuccessMessage('Your password has been successfully reset');

        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }

      setLoadingId('');
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-center">Reset Password</h2>

      <Form onSubmit={handleSubmit}>
        <FormTextInput
          id="email"
          title="Email"
          value={email}
          setValue={setEmail}
          nextFocusTargetId="password"
          autoFocus
        />
        <FormTextInput
          id="password"
          title="Password"
          value={password}
          setValue={setPassword}
          nextFocusTargetId="password_repeat"
          password
        />
        <FormTextInput
          id="password_repeat"
          title="Repeat password"
          value={passwordRepeat}
          setValue={setPasswordRepeat}
          nextFocusTargetId="form_submit_button"
          password
        />
      </Form>
    </div>
  );
};

export default ResetPasswordPage;
