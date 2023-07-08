'use client';

import { useState } from 'react';
import myFetch from '~/helpers/myFetch';
import Form from '@c/form/Form';
import FormCountrySelect from '@c/form/FormCountrySelect';
import FormTextInput from '@c/form/FormTextInput';

const AdminPerson = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [countryId, setCountryId] = useState('');

  const handleSubmit = async () => {
    const person = {
      name,
      countryId,
    };

    const response = await myFetch.post('/persons', person);

    if (response?.errors) {
      setErrorMessages(response.errors);
    } else {
      setErrorMessages([]);
      setName('');
      document.getElementById('full_name').focus();
    }
  };

  return (
    <>
      <h2 className="mb-4 text-center">Create New Competitor</h2>
      <Form buttonText="Create" errorMessages={errorMessages} handleSubmit={handleSubmit}>
        <FormTextInput id="full_name" name="Full Name" value={name} setValue={setName} />
        <FormCountrySelect countryId={countryId} setCountryId={setCountryId} />
      </Form>
    </>
  );
};

export default AdminPerson;
