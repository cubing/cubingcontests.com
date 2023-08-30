'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import myFetch from '~/helpers/myFetch';
import Form from '@c/form/Form';
import FormCountrySelect from '@c/form/FormCountrySelect';
import FormTextInput from '@c/form/FormTextInput';
import FormCheckbox from '~/app/components/form/FormCheckbox';
import { limitRequests } from '~/helpers/utilityFunctions';

const INVALID_WCA_ID_ERROR = 'Please enter a valid WCA ID';

const CreatePerson = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [name, setName] = useState('');
  const [localizedName, setLocalizedName] = useState('');
  const [wcaId, setWcaId] = useState('');
  const [noWcaId, setNoWcaId] = useState(false);
  const [countryIso2, setCountryIso2] = useState('NOT_SELECTED');
  const [fetchPersonDataTimer, setFetchPersonDataTimer] = useState<NodeJS.Timeout>(null);

  const searchParams = useSearchParams();

  const handleSubmit = async () => {
    resetMessages();

    // Validation
    const tempErrors: string[] = [];

    if (!noWcaId) {
      if (!getWcaIdIsValid()) tempErrors.push(INVALID_WCA_ID_ERROR);
      if (!name.trim() || countryIso2 === 'NOT_SELECTED') tempErrors.push('Invalid competitor, please try again');

      document.getElementById('wca_id').focus();
    } else {
      if (!name.trim()) {
        tempErrors.push('Please enter a name');
        document.getElementById('full_name').focus();
      }
      if (countryIso2 === 'NOT_SELECTED') tempErrors.push('Please select a country');
    }

    if (tempErrors.length > 0) {
      setErrorMessages(tempErrors);
    } else {
      const person = {
        name: name.trim(),
        localizedName: localizedName.trim() ? localizedName.trim() : undefined,
        wcaId: noWcaId ? undefined : wcaId,
        countryIso2,
      };

      const { errors } = await myFetch.post('/persons', person);

      if (errors) {
        setErrorMessages(errors);
      } else {
        const redirect = searchParams.get('redirect');

        reset();
        setErrorMessages([]);
        setSuccessMessage(`${name} successfully added${redirect ? '. Going back...' : ''}`);

        // Redirect if there is a redirect parameter in the URL
        if (!redirect) {
          if (noWcaId) document.getElementById('full_name').focus();
          else document.getElementById('wca_id').focus();
        } else {
          setTimeout(() => window.location.replace(redirect), 1000);
        }
      }
    }
  };

  const getWcaIdIsValid = (value = wcaId) => value && /[0-9]{4}[A-Z]{4}[0-9]{2}/.test(value);

  const changeWcaId = (value: string) => {
    value = value.trim().toUpperCase();

    if (/[^A-Z0-9]/.test(value)) {
      setErrorMessages(['A WCA ID can only have alphanumeric characters']);
    } else if (value.length <= 10) {
      setWcaId(value);
      resetMessages();

      if (value.length < 10) {
        reset(true);
      } else {
        if (!getWcaIdIsValid(value)) {
          setErrorMessages([INVALID_WCA_ID_ERROR]);
        } else {
          limitRequests(fetchPersonDataTimer, setFetchPersonDataTimer, async () => {
            const { payload, errors } = await myFetch.get(
              `https://www.worldcubeassociation.org/api/v0/persons/${value}`,
            );

            if (errors) {
              setErrorMessages([`Competitor with WCA ID ${value} not found`]);
              // It doesn't focus without the setTimeout because of a rerender after the checkbox is changed
              setTimeout(() => document.getElementById('wca_id').focus(), 1); // 1 millisecond
            } else {
              if (payload?.person?.name) {
                // Extract localized name
                const stringParts = payload.person.name.split(' (');
                setName(stringParts[0]);

                if (stringParts.length > 1) setLocalizedName(stringParts[1].slice(0, -1)); // get rid of )
              }

              if (payload?.person?.country_iso2) setCountryIso2(payload.person.country_iso2);

              // It doesn't focus without the setTimeout because of a rerender after the checkbox is changed
              setTimeout(() => document.getElementById('form_submit_button').focus(), 1); // 1 millisecond
            }
          });
        }
      }
    }
  };

  const changeNoWcaId = (value: boolean) => {
    setNoWcaId(value);

    // It doesn't focus without the setTimeout because of a rerender after the checkbox is changed
    if (value) {
      setWcaId('');
      setTimeout(() => document.getElementById('full_name').focus(), 0);
    } else {
      reset();
      setTimeout(() => document.getElementById('wca_id').focus(), 0);
    }
  };

  const changeName = (value: string) => {
    setName(value);
    resetMessages();
  };

  const onNameKeyDown = (e: any) => {
    if (e.key === 'Enter') document.getElementById('localized_name').focus();
  };

  const changeLocalizedName = (value: string) => {
    setLocalizedName(value);
    resetMessages();
  };

  const onLocNameKeyDown = (e: any) => {
    if (e.key === 'Enter') document.getElementById('country_iso_2').focus();
  };

  const onCountryKeyDown = (e: any) => {
    if (e.key === 'Enter') document.getElementById('form_submit_button').focus();
  };

  const resetMessages = () => {
    setSuccessMessage('');
    setErrorMessages([]);
  };

  const reset = (exceptWcaId = false) => {
    setName('');
    setLocalizedName('');
    setCountryIso2('NOT_SELECTED');
    if (!exceptWcaId) setWcaId('');
  };

  return (
    <>
      <h2 className="mb-4 text-center">Add New Competitor</h2>
      <Form
        buttonText="Submit"
        errorMessages={errorMessages}
        successMessage={successMessage}
        handleSubmit={handleSubmit}
        disableButton={fetchPersonDataTimer !== null}
      >
        <FormTextInput
          title="WCA ID"
          id="wca_id"
          monospace
          value={wcaId}
          setValue={changeWcaId}
          autoFocus
          disabled={noWcaId || fetchPersonDataTimer !== null}
        />
        <FormCheckbox
          title="Competitor doesn't have a WCA ID"
          selected={noWcaId}
          setSelected={changeNoWcaId}
          disabled={fetchPersonDataTimer !== null}
        />
        <FormTextInput
          title="Full Name"
          id="full_name"
          value={name}
          setValue={changeName}
          onKeyDown={onNameKeyDown}
          disabled={!noWcaId}
        />
        <FormTextInput
          title="Localized Name"
          id="localized_name"
          value={localizedName}
          setValue={changeLocalizedName}
          onKeyDown={onLocNameKeyDown}
          disabled={!noWcaId}
        />
        <FormCountrySelect
          countryIso2={countryIso2}
          setCountryId={setCountryIso2}
          onKeyDown={onCountryKeyDown}
          disabled={!noWcaId}
        />
      </Form>
    </>
  );
};

export default CreatePerson;
