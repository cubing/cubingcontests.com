'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import FormTextInput from '@c/form/FormTextInput';
import Form from '@c/form/Form';
import myFetch from '~/helpers/myFetch';

const Register = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    document.getElementById('username').focus();
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
        <FormTextInput id="username" title="Username" value={username} setValue={setUsername} />
        <FormTextInput title="Email" value={email} setValue={setEmail} />
        <div className="d-flex justify-content-between align-items-end gap-3">
          <div className="flex-grow-1">
            <FormTextInput title="Password" isPassword={!showPassword} value={password} setValue={setPassword} />
          </div>
          <button type="button" className="mb-3 btn btn-primary" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <Link href="/login" className="d-block mt-4 fs-5">
          Log in
        </Link>
      </Form>
    </>
  );
};

export default Register;
