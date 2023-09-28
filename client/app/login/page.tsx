'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import myFetch from '~/helpers/myFetch';
import FormTextInput from '@c/form/FormTextInput';
import Form from '@c/form/Form';

const LoginPage = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const searchParams = useSearchParams();

  const handleSubmit = async () => {
    const tempErrors: string[] = [];

    if (!password) {
      tempErrors.push('Please enter a password');
      document.getElementById('password').focus();
    }
    if (!username) {
      tempErrors.push('Please enter a username');
      document.getElementById('username').focus();
    }

    if (tempErrors.length === 0) {
      setErrorMessages([]);

      const { payload, errors } = await myFetch.post('/auth/login', { username, password }, { authorize: false });

      if (errors) {
        tempErrors.push(...errors);
      } else if (payload) {
        if (!payload.accessToken) {
          tempErrors.push('Access token not received');
        } else {
          localStorage.setItem('jwtToken', `Bearer ${payload.accessToken}`);

          // Redirect if there is a redirect parameter in the URL
          const redirect = searchParams.get('redirect');

          if (redirect) window.location.replace(redirect);
          else window.location.href = '/';
        }
      }
    }

    setErrorMessages(tempErrors);
  };

  return (
    <>
      <h2 className="mb-4 text-center">Login</h2>
      <Form buttonText="Log in" errorMessages={errorMessages} handleSubmit={handleSubmit}>
        <FormTextInput id="username" title="Username" value={username} onChange={setUsername} autoFocus submitOnEnter />
        <FormTextInput id="password" title="Password" value={password} onChange={setPassword} password submitOnEnter />
        <Link href="/register" className="d-block mt-4 fs-5">
          Create account
        </Link>
      </Form>
    </>
  );
};

export default LoginPage;
