'use client';

import { useContext, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMyFetch } from '~/helpers/customHooks';
import { IFePerson } from '@sh/types';
import Form from '@c/form/Form';
import { MainContext } from '~/helpers/contexts';
import { limitRequests } from '~/helpers/utilityFunctions';
import CreatorDetails from '@c/CreatorDetails';
import FormTextInput from '@c/form/FormTextInput';
import FormCheckbox from '@c/form/FormCheckbox';
import FormCountrySelect from '@c/form/FormCountrySelect';

const PersonForm = ({
  personUnderEdit,
  onSubmit,
  onCancel,
}: {
  personUnderEdit: IFePerson | undefined;
  onSubmit: (person: IFePerson, isNew?: boolean) => void;
  onCancel: (() => void) | undefined;
}) => {
  const searchParams = useSearchParams();
  const myFetch = useMyFetch();
  const { changeErrorMessages, changeSuccessMessage, loadingId, resetMessagesAndLoadingId } = useContext(MainContext);
  const fetchPersonDataTimer = useRef<NodeJS.Timeout>(null);

  const [nextFocusTarget, setNextFocusTarget] = useState('');
  const [person, setPerson] = useState(personUnderEdit);

  const [name, setName] = useState(personUnderEdit?.name ?? '');
  const [localizedName, setLocalizedName] = useState(personUnderEdit?.localizedName ?? '');
  const [wcaId, setWcaId] = useState(personUnderEdit?.wcaId ?? '');
  const [hasWcaId, setHasWcaId] = useState<boolean>(personUnderEdit === undefined || !!personUnderEdit.wcaId);
  const [countryIso2, setCountryIso2] = useState(personUnderEdit?.countryIso2 ?? 'NOT_SELECTED');

  useEffect(() => {
    if (nextFocusTarget) {
      document.getElementById(nextFocusTarget)?.focus();
      setNextFocusTarget('');
    }
    // These dependencies are required so that it focuses AFTER everything has been rerendered
  }, [nextFocusTarget, wcaId, name, localizedName, countryIso2, hasWcaId]);

  const handleSubmit = async () => {
    if (!person) {
      const newPerson = {
        name: name.trim(),
        localizedName: localizedName.trim() || undefined,
        wcaId: hasWcaId ? wcaId : undefined,
        countryIso2,
      };
      const { payload, errors } = personUnderEdit
        ? await myFetch.patch(`/persons/${(personUnderEdit as any)._id}`, newPerson, {
          loadingId: 'form_submit_button',
        })
        : await myFetch.post('/persons', newPerson, { loadingId: 'form_submit_button' });

      if (!errors) afterSubmit(payload);
    } else {
      afterSubmit(person);
    }
  };

  const afterSubmit = (newPerson: IFePerson) => {
    const redirect = searchParams.get('redirect');

    reset();
    changeSuccessMessage(
      `${name} successfully ${personUnderEdit ? 'updated' : 'added'}${redirect ? '. Going back...' : ''}`,
    );

    // Redirect if there is a redirect parameter in the URL, otherwise focus the first input
    if (!redirect) {
      onSubmit(newPerson, !personUnderEdit);

      if (hasWcaId) setNextFocusTarget('wca_id');
      else setNextFocusTarget('full_name');
    } else {
      setTimeout(() => window.location.replace(redirect), 1000); // 1 second delay
    }
  };

  const changeWcaId = (value: string) => {
    value = value.trim().toUpperCase();

    if (/[^A-Z0-9]/.test(value)) {
      changeErrorMessages(['A WCA ID can only have alphanumeric characters']);
    } else if (value.length <= 10) {
      setWcaId(value);

      if (value.length < 10) {
        reset(true);
        return;
      }

      limitRequests(fetchPersonDataTimer, async () => {
        setName('');
        setLocalizedName('');
        setCountryIso2('NOT_SELECTED');

        const { payload, errors }: { payload?: IFePerson; errors?: string[] } = await myFetch.get(`/persons/${value}`, {
          authorize: true,
          loadingId: null,
        });

        if (errors) {
          changeErrorMessages([`Competitor with WCA ID ${value} not found`]);
          setNextFocusTarget('wca_id');
        } else {
          resetMessagesAndLoadingId();
          setPerson(payload);
          setName(payload.name);
          setLocalizedName(payload.localizedName ?? '');
          setCountryIso2(payload.countryIso2);
          setNextFocusTarget('form_submit_button');
        }
      });
    }
  };

  const changeHasWcaId = (noWcaId: boolean) => {
    resetMessagesAndLoadingId();
    setHasWcaId(!noWcaId);

    if (noWcaId) {
      setWcaId('');
      setNextFocusTarget('full_name');
    } else {
      reset();
      setNextFocusTarget('wca_id');
    }
  };

  const reset = (exceptWcaId = false) => {
    setPerson(undefined);
    setName('');
    setLocalizedName('');
    setCountryIso2('NOT_SELECTED');
    if (!exceptWcaId) setWcaId('');
  };

  return (
    <Form
      buttonText="Submit"
      onSubmit={handleSubmit}
      showCancelButton={onCancel !== undefined}
      onCancel={onCancel}
      disableButton={fetchPersonDataTimer.current !== null}
    >
      {personUnderEdit && <CreatorDetails creator={personUnderEdit.creator} />}
      <FormTextInput
        title="WCA ID"
        id="wca_id"
        monospace
        value={wcaId}
        setValue={changeWcaId}
        autoFocus
        disabled={loadingId !== '' || !hasWcaId}
      />
      <FormCheckbox
        title="Competitor doesn't have a WCA ID"
        selected={!hasWcaId}
        setSelected={changeHasWcaId}
        disabled={loadingId !== ''}
      />
      <FormTextInput
        title="Full Name"
        id="full_name"
        value={name}
        setValue={setName}
        nextFocusTargetId="localized_name"
        disabled={loadingId !== '' || hasWcaId}
      />
      <FormTextInput
        title="Localized Name (optional)"
        id="localized_name"
        value={localizedName}
        setValue={setLocalizedName}
        nextFocusTargetId="country_iso_2"
        disabled={loadingId !== '' || hasWcaId}
      />
      <FormCountrySelect
        countryIso2={countryIso2}
        setCountryIso2={setCountryIso2}
        nextFocusTargetId="form_submit_button"
        disabled={loadingId !== '' || hasWcaId}
      />
    </Form>
  );
};

export default PersonForm;
