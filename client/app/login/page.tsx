'use client';

import { useContext, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import myFetch from '~/helpers/myFetch';
import FormTextInput from '@c/form/FormTextInput';
import Form from '@c/form/Form';
import { MainContext } from '~/helpers/contexts';

const LoginPage = () => {
  const searchParams = useSearchParams();
  const { setErrorMessages, setLoadingId } = useContext(MainContext);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    const tempErrors: string[] = [];

    if (!password) {
      tempErrors.push('Please enter a password');
      document.getElementById('password').focus();
    }
    if (!username) {
      tempErrors.push('Please enter a username or email address');
      document.getElementById('username').focus();
    }

    if (tempErrors.length > 0) {
      setErrorMessages(tempErrors);
    } else {
      setLoadingId('form_submit_button');
      setErrorMessages([]);

      const { payload, errors } = await myFetch.post('/auth/login', { username, password }, { authorize: false });

      if (errors) {
        if (errors[0] === 'UNCONFIRMED') {
          window.location.href = `/register/confirm-email?username=${username}`;
          return;
        } else {
          setErrorMessages(errors);
        }
      } else if (payload) {
        if (!payload.accessToken) {
          setErrorMessages(['Access token not received']);
        } else {
          localStorage.setItem('jwtToken', `Bearer ${payload.accessToken}`);

          const redirectUrl = searchParams.get('redirect');

          if (redirectUrl) window.location.replace(redirectUrl);
          else window.location.href = '/';
          return;
        }
      }

      setLoadingId('');
    }
  };

  const changeUsername = (newValue: string) => {
    setUsername(newValue);
    setErrorMessages([]);
  };

  const changePassword = (newValue: string) => {
    setPassword(newValue);
    setErrorMessages([]);
  };

  return (
    <div>
      <h2 className="mb-4 text-center">Login</h2>

      <Form buttonText="Log in" onSubmit={handleSubmit}>
        <FormTextInput
          id="username"
          title="Username or email"
          value={username}
          setValue={changeUsername}
          nextFocusTargetId="password"
          autoFocus
        />
        <FormTextInput
          id="password"
          title="Password"
          value={password}
          setValue={changePassword}
          password
          submitOnEnter
        />
        <Link href="/reset-password" className="d-block mt-4">
          Forgot password?
        </Link>
      </Form>

      <div className="container mt-5 mx-auto px-3" style={{ maxWidth: '768px' }}>
        <Link href="/register" className="fs-5">
          Create account
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
