'use client';

import { useState } from 'react';
import Link from 'next/link';
import FormTextInput from '@c/form/FormTextInput';
import Form from '@c/form/Form';
import myFetch from '~/helpers/myFetch';

const RegisterPage = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [loadingDuringSubmit, setLoadingDuringSubmit] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');

  const handleSubmit = async () => {
    const tempErrors: string[] = [];

    if (!username) tempErrors.push('Please enter a username');
    if (!email) tempErrors.push('Please enter an email address');
    if (!password) tempErrors.push('Please enter a password');
    else if (!passwordRepeat) tempErrors.push('Please confirm your password');
    else if (passwordRepeat !== password) tempErrors.push('The entered passwords do not match');

    if (tempErrors.length > 0) {
      setErrorMessages(tempErrors);
    } else {
      setLoadingDuringSubmit(true);
      setErrorMessages([]);

      const { errors } = await myFetch.post('/auth/register', { username, email, password }, { authorize: false });

      if (errors) {
        setErrorMessages(errors);
      } else {
        window.location.href = `/register/confirm-email?username=${username}`;
      }

      setLoadingDuringSubmit(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-center">Register</h2>

      <Form
        buttonText="Register"
        errorMessages={errorMessages}
        onSubmit={handleSubmit}
        disableButton={loadingDuringSubmit}
      >
        <FormTextInput title="Username" value={username} setValue={setUsername} nextFocusTargetId="email" autoFocus />
        <FormTextInput id="email" title="Email" value={email} setValue={setEmail} nextFocusTargetId="password" />
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
        <Link href="/login" className="d-block mt-4 fs-5">
          Log in
        </Link>
      </Form>
    </div>
  );
};

export default RegisterPage;
