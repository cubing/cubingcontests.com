'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import myFetch from '~/helpers/myFetch';
import Form from '@c/form/Form';
import FormCountrySelect from '@c/form/FormCountrySelect';
import FormTextInput from '@c/form/FormTextInput';
import FormCheckbox from '~/app/components/form/FormCheckbox';
import { limitRequests, splitNameAndLocalizedName } from '~/helpers/utilityFunctions';
import C from '@sh/constants';

const INVALID_WCA_ID_ERROR = 'Please enter a valid WCA ID';

const CreatePersonPage = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [name, setName] = useState('');
  const [localizedName, setLocalizedName] = useState('');
  const [wcaId, setWcaId] = useState('');
  const [noWcaId, setNoWcaId] = useState(false);
  const [countryIso2, setCountryIso2] = useState('NOT_SELECTED');
  const [fetchPersonDataTimer, setFetchPersonDataTimer] = useState<NodeJS.Timeout>(null);
  const [nextFocusTarget, setNextFocusTarget] = useState('');

  const searchParams = useSearchParams();

  useEffect(() => {
    if (nextFocusTarget) {
      document.getElementById(nextFocusTarget)?.focus();
      setNextFocusTarget('');
    }
    // These dependencies are required so that it focuses AFTER everything has been rerendered
  }, [nextFocusTarget, wcaId, name, localizedName, countryIso2, fetchPersonDataTimer]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const handleSubmit = async () => {
    resetMessages();

    // Validation
    const tempErrors: string[] = [];

    if (!noWcaId) {
      if (!getWcaIdIsValid()) tempErrors.push(INVALID_WCA_ID_ERROR);
      else if (!name.trim() || countryIso2 === 'NOT_SELECTED') tempErrors.push('Invalid competitor, please try again');

      setNextFocusTarget('wca_id');
    } else {
      if (!name.trim()) {
        tempErrors.push('Please enter a name');
        setNextFocusTarget('full_name');
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

        // Redirect if there is a redirect parameter in the URL, otherwise focus the first input
        if (!redirect) {
          if (noWcaId) setNextFocusTarget('full_name');
          else setNextFocusTarget('wca_id');
        } else {
          setTimeout(() => window.location.replace(redirect), 1000); // 1 second delay
        }
      }
    }
  };

  const getWcaIdIsValid = (value = wcaId) => value && C.wcaIdRegex.test(value);

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
            const { payload, errors } = await myFetch.get(`${C.wcaApiBase}/persons/${value}.json`);

            if (errors) {
              setErrorMessages([`Competitor with WCA ID ${value} not found`]);
              setNextFocusTarget('wca_id');
            } else {
              if (!payload?.name || !payload?.country) {
                setErrorMessages(['Error while getting competitor data. Please contact an admin about this error.']);
              } else {
                const [name, localizedName] = splitNameAndLocalizedName(payload.name);
                setName(name);
                setLocalizedName(localizedName || '');
                setCountryIso2(payload.country);
                setNextFocusTarget('form_submit_button');
              }
            }
          });
        }
      }
    }
  };

  const changeNoWcaId = (value: boolean) => {
    setNoWcaId(value);

    if (value) {
      setWcaId('');
      setNextFocusTarget('full_name');
    } else {
      reset();
      setNextFocusTarget('wca_id');
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
        onSubmit={handleSubmit}
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
          nextFocusTargetId="localized_name"
          disabled={!noWcaId}
        />
        <FormTextInput
          title="Localized Name (optional)"
          id="localized_name"
          value={localizedName}
          setValue={changeLocalizedName}
          nextFocusTargetId="country_iso_2"
          disabled={!noWcaId}
        />
        <FormCountrySelect
          countryIso2={countryIso2}
          setCountryId={setCountryIso2}
          nextFocusTargetId="form_submit_button"
          disabled={!noWcaId}
        />
      </Form>
    </>
  );
};

export default CreatePersonPage;
