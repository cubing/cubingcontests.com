'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import FormTextInput from '@c/form/FormTextInput';
import Form from '@c/form/Form';
import myFetch from '~/helpers/myFetch';

const Register = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    document.getElementById('name').focus();
  }, []);

  const handleSubmit = async () => {
    const tempErrors: string[] = [];

    if (!username) tempErrors.push('Please enter a username');
    if (!email) tempErrors.push('Please enter an email address');
    if (!password) tempErrors.push('Please enter a password');

    if (tempErrors.length === 0) {
      const { errors } = await myFetch.post('/auth/register', { username, email, password }, { authorize: false });

      if (errors) {
        tempErrors.push(...errors);
      } else {
        window.location.href = '/login';
      }
    }

    setErrorMessages(tempErrors);
  };

  return (
    <>
      <h2 className="mb-4 text-center">Register</h2>
      <Form buttonText="Register" errorMessages={errorMessages} handleSubmit={handleSubmit}>
        <FormTextInput id="username" name="Username" value={username} setValue={setUsername} />
        <FormTextInput name="Email" value={email} setValue={setEmail} />
        <FormTextInput name="Password" isPassword value={password} setValue={setPassword} />
        <Link href="/login" className="d-block mt-4 fs-5">
          Log in
        </Link>
      </Form>
    </>
  );
};

export default Register;
