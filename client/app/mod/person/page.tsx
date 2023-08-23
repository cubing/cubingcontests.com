'use client';

import { useState, useEffect } from 'react';
import myFetch from '~/helpers/myFetch';
import Form from '@c/form/Form';
import FormCountrySelect from '@c/form/FormCountrySelect';
import FormTextInput from '@c/form/FormTextInput';

const CreatePerson = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [name, setName] = useState('');
  const [localizedName, setLocalizedName] = useState('');
  const [wcaId, setWcaId] = useState('');
  const [countryIso2, setCountryIso2] = useState('');

  useEffect(() => {
    document.getElementById('wca_id')?.focus();
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

  const changeLocalizedName = (value: string) => {
    setLocalizedName(value);
    resetMessages();
  };

  const changeWcaId = (value: string) => {
    value = value.trim();

    if (value.length > 10) {
      setErrorMessages(['A WCA ID must have exactly ten characters']);
    } else {
      // Only allow alphanumeric characters and replace lowercase letters with uppercase
      setWcaId(value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
      resetMessages();
    }
  };

  const submitWcaId = async (e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const { payload, errors } = await myFetch.get(`https://www.worldcubeassociation.org/api/v0/persons/${wcaId}`);

      if (errors) {
        setErrorMessages([`Competitor with WCA ID ${wcaId} not found`]);
      } else {
        if (payload?.person?.name) {
          // Extract localized name
          const stringParts = payload.person.name.split(' (');
          setName(stringParts[0]);

          if (stringParts.length > 1) setLocalizedName(stringParts[1].slice(0, -1)); // get rid of )
        }

        if (payload?.person?.country_iso2) setCountryIso2(payload.person.country_iso2);

        document.getElementById('form_submit_button')?.focus();
      }
    }
  };

  const resetMessages = () => {
    setSuccessMessage('');
    setErrorMessages([]);
  };

  return (
    <>
      <h2 className="mb-4 text-center">Add New Competitor</h2>
      <Form
        buttonText="Create"
        errorMessages={errorMessages}
        successMessage={successMessage}
        handleSubmit={handleSubmit}
      >
        <p>Press ENTER after entering the WCA ID</p>
        <FormTextInput
          id="wca_id"
          title="WCA ID"
          monospace
          value={wcaId}
          setValue={changeWcaId}
          onKeyDown={submitWcaId}
        />
        <FormTextInput title="Full Name" value={name} setValue={changeName} />
        <FormTextInput title="Localized Name" value={localizedName} setValue={changeLocalizedName} />
        <FormCountrySelect countryIso2={countryIso2} setCountryId={setCountryIso2} />
      </Form>
    </>
  );
};

export default CreatePerson;
