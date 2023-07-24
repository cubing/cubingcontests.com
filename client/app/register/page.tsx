'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import FormTextInput from '@c/form/FormTextInput';
import Form from '@c/form/Form';
import myFetch from '~/helpers/myFetch';
import { selectPerson } from '~/helpers/utilityFunctions';
import { IPerson } from '~/shared_helpers/interfaces';

const Register = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [person, setPerson] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    document.getElementById('name').focus();
  }, []);

  const handleSubmit = async () => {
    const tempErrors: string[] = [];

    if (!person) tempErrors.push('Please enter your name and press ENTER');
    if (!username) tempErrors.push('Please enter a username');
    if (!email) tempErrors.push('Please enter an email address');
    if (!password) tempErrors.push('Please enter a password');

    if (tempErrors.length === 0) {
      const { errors } = await myFetch.post(
        '/auth/register',
        { personId: person.personId, username, email, password },
        { authorize: false },
      );

      if (errors) {
        tempErrors.push(...errors);
      } else {
        window.location.href = '/login';
      }
    }

    setErrorMessages(tempErrors);
  };

  const onSelectPerson = async (e: any) => {
    selectPerson(e, setErrorMessages, (person: IPerson) => {
      setPerson(person);
      setName(person.name);
      setErrorMessages([]);
      document.getElementById('username')?.focus();
    });
  };

  const changeName = (value: string) => {
    setPerson(null);
    setName(value);
  };

  return (
    <>
      <h2 className="mb-4 text-center">Register</h2>
      <Form buttonText="Register" errorMessages={errorMessages} handleSubmit={handleSubmit}>
        {!person && <p>Press ENTER after entering your name to select a competitor from the database</p>}
        <FormTextInput
          id="name"
          name="Full name"
          value={name}
          setValue={(val: string) => changeName(val)}
          onKeyPress={(e: any) => onSelectPerson(e)}
        />
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
