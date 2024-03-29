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

  const handleSubmit = async () => {
    setLoadingDuringSubmit(true);

    const tempErrors: string[] = [];

    if (!username) tempErrors.push('Please enter a username');
    if (!email) tempErrors.push('Please enter an email address');
    if (!password) tempErrors.push('Please enter a password');

    if (tempErrors.length === 0) {
      setErrorMessages([]);

      const { errors } = await myFetch.post('/auth/register', { username, email, password }, { authorize: false });

      if (errors) {
        tempErrors.push(...errors);
      } else {
        window.location.href = `/register/confirm-email?username=${username}`;
      }
    }

    setErrorMessages(tempErrors);
    setLoadingDuringSubmit(false);
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
