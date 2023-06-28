'use client';

import { useState } from 'react';
import myFetch from '~/helpers/myFetch';
import Form from '~/app/components/form/Form';
import FormCountrySelect from '~/app/components/form/FormCountrySelect';
import FormTextInput from '~/app/components/form/FormTextInput';

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
      window.location.href = '/admin';
    }
  };

  return (
    <>
      <h2 className="mb-4 text-center">Create New Competitor</h2>
      <Form buttonText="Create" errorMessages={errorMessages} handleSubmit={handleSubmit}>
        <FormTextInput name="Full Name" value={name} setValue={setName} />
        <FormCountrySelect countryId={countryId} setCountryId={setCountryId} />
      </Form>
    </>
  );
};

export default AdminPerson;
