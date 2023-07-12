'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import FormTextInput from '@c/form/FormTextInput';
import Form from '@c/form/Form';
import myFetch from '~/helpers/myFetch';

const Register = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    document.getElementById('username').focus();
  }, []);

  const handleSubmit = async () => {
    const tempErrors: string[] = [];

    if (!name) tempErrors.push('Please enter your name');
    if (!username) tempErrors.push('Please enter a username');
    if (!password) tempErrors.push('Please enter a password');

    if (name && username && password) {
      const { errors } = await myFetch.post('/auth/register', { name, username, password }, { authorize: false });

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
        <FormTextInput name="Full name" value={name} setValue={setName} />
        <FormTextInput name="Username" value={username} setValue={setUsername} />
        <FormTextInput name="Password" password value={password} setValue={setPassword} />
        <Link href="/login" className="d-block mt-4 fs-5">
          Log in
        </Link>
      </Form>
    </>
  );
};

export default Register;
