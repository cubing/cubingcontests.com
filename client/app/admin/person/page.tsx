'use client';

import { useState, useEffect } from 'react';
import myFetch from '~/helpers/myFetch';
import Form from '@c/form/Form';
import FormCountrySelect from '@c/form/FormCountrySelect';
import FormTextInput from '@c/form/FormTextInput';

const AdminPerson = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [name, setName] = useState('');
  const [wcaId, setWcaId] = useState('');
  const [countryIso2, setCountryId] = useState('');

  useEffect(() => {
    document.getElementById('full_name')?.focus();
  }, []);

  const handleSubmit = async () => {
    resetMessages();

    // Validation
    const tempErrors: string[] = [];

    if (!name.trim()) tempErrors.push('Please enter a name');
    if (wcaId && wcaId.length !== 10) tempErrors.push('A WCA ID must have exactly ten characters');

    if (tempErrors.length > 0) {
      setErrorMessages(tempErrors);
    } else {
      const person = {
        name: name.trim(),
        wcaId: wcaId ? wcaId : undefined,
        countryIso2,
      };

      const { errors } = await myFetch.post('/persons', person);

      if (errors) {
        setErrorMessages(errors);
      } else {
        setErrorMessages([]);
        setSuccessMessage(`${name} successfully added`);
        setName('');
        setWcaId('');
        document.getElementById('full_name').focus();
      }
    }
  };

  const changeName = (value: string) => {
    setName(value);
    resetMessages();
  };

  const changeWcaId = (value: string) => {
    if (value.length > 10) {
      setErrorMessages(['A WCA ID must have exactly ten characters']);
    } else {
      // Only allow alphanumeric characters and replace lowercase letters with uppercase
      setWcaId(value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
      resetMessages();
    }
  };

  const resetMessages = () => {
    setSuccessMessage('');
    setErrorMessages([]);
  };

  return (
    <>
      <h2 className="mb-4 text-center">Create New Competitor</h2>
      {errorMessages.length === 0 && successMessage && (
        <div className="mb-3 alert alert-success fs-5">{successMessage}</div>
      )}
      <Form buttonText="Create" errorMessages={errorMessages} handleSubmit={handleSubmit}>
        <FormTextInput id="full_name" title="Full Name" value={name} setValue={changeName} />
        <FormTextInput title="WCA ID" monospace value={wcaId} setValue={changeWcaId} />
        <FormCountrySelect countryIso2={countryIso2} setCountryId={setCountryId} />
      </Form>
    </>
  );
};

export default AdminPerson;
