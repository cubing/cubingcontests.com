'use client';

import { useState } from 'react';
import myFetch from '~/helpers/myFetch';
import FormTextInput from '@c/form/FormTextInput';
import Link from 'next/link';
import Form from '@c/form/Form';

const Login = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    const tempErrors: string[] = [];

    if (!username) tempErrors.push('Please enter a username');
    if (!password) tempErrors.push('Please enter a password');

    if (username && password) {
      const data = await myFetch.post('/auth/login', { username, password }, { authorize: false });

      if (data?.errors) {
        tempErrors.push(...data.errors);
      } else if (!data?.access_token) {
        tempErrors.push('Access token not received');
      } else {
        localStorage.setItem('jwtToken', `Bearer ${data.access_token}`);
        window.location.href = '/';
      }
    }

    setErrorMessages(tempErrors);
  };

  return (
    <>
      <h2 className="mb-4 text-center">Login</h2>
      <Form buttonText="Log in" errorMessages={errorMessages} handleSubmit={handleSubmit}>
        <FormTextInput name="Username" value={username} setValue={setUsername} />
        <FormTextInput name="Password" password value={password} setValue={setPassword} />
        <Link href="/register" className="d-block mt-4 fs-5">
          Create account
        </Link>
      </Form>
    </>
  );
};

export default Login;
