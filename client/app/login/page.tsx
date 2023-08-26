'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import myFetch from '~/helpers/myFetch';
import FormTextInput from '@c/form/FormTextInput';
import Form from '@c/form/Form';

const Login = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const searchParams = useSearchParams();

  useEffect(() => {
    document.getElementById('username').focus();
  }, []);

  const handleSubmit = async () => {
    const tempErrors: string[] = [];

    if (!username) tempErrors.push('Please enter a username');
    if (!password) tempErrors.push('Please enter a password');

    if (tempErrors.length === 0) {
      const { payload, errors } = await myFetch.post('/auth/login', { username, password }, { authorize: false });

      if (errors) {
        tempErrors.push(...errors);
      } else if (!payload.accessToken) {
        tempErrors.push('Access token not received');
      } else {
        localStorage.setItem('jwtToken', `Bearer ${payload.accessToken}`);

        // Redirect to page in the ?redirect parameter or home if it's not set
        const redirect = searchParams.get('redirect');
        if (redirect) window.location.href = `/${redirect}`;
        else window.location.href = '/';
      }
    }

    setErrorMessages(tempErrors);
  };

  return (
    <>
      <h2 className="mb-4 text-center">Login</h2>
      <Form buttonText="Log in" errorMessages={errorMessages} handleSubmit={handleSubmit}>
        <FormTextInput id="username" title="Username" value={username} setValue={setUsername} />
        <FormTextInput title="Password" value={password} setValue={setPassword} isPassword />
        <Link href="/register" className="d-block mt-4 fs-5">
          Create account
        </Link>
      </Form>
    </>
  );
};

export default Login;
