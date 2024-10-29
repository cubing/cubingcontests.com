'use client';

import { useContext, useState } from 'react';
import Link from 'next/link';
import { useMyFetch } from '~/helpers/customHooks.ts';
import FormTextInput from '~/app/components/form/FormTextInput.tsx';
import Form from '~/app/components/form/Form.tsx';
import { MainContext } from '~/helpers/contexts.ts';

const RegisterPage = () => {
  const myFetch = useMyFetch();
  const { changeErrorMessages } = useContext(MainContext);

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
    else if (passwordRepeat !== password) {
      tempErrors.push('The entered passwords do not match');
    }

    if (tempErrors.length > 0) {
      changeErrorMessages(tempErrors);
    } else {
      const { errors } = await myFetch.post(
        '/auth/register',
        { username, email, password },
        { authorize: false, loadingId: 'form_submit_button' },
      );

      if (!errors) {
        window.location.href = `/register/confirm-email?username=${username}`;
      }
    }
  };

  return (
    <div>
      <h2 className='mb-4 text-center'>Register</h2>

      <Form buttonText='Register' onSubmit={handleSubmit}>
        <FormTextInput
          title='Username'
          value={username}
          setValue={setUsername}
          nextFocusTargetId='email'
          autoFocus
        />
        <FormTextInput
          id='email'
          title='Email'
          value={email}
          setValue={setEmail}
          nextFocusTargetId='password'
        />
        <FormTextInput
          id='password'
          title='Password'
          value={password}
          setValue={setPassword}
          nextFocusTargetId='password_repeat'
          password
        />
        <FormTextInput
          id='password_repeat'
          title='Repeat password'
          value={passwordRepeat}
          setValue={setPasswordRepeat}
          nextFocusTargetId='form_submit_button'
          password
        />
      </Form>

      <div
        className='container mt-4 mx-auto px-3 fs-5'
        style={{ maxWidth: '768px' }}
      >
        <Link href='/login'>Log in</Link>
      </div>
    </div>
  );
};

export default RegisterPage;
