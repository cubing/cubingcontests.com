'use client';

import { useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import myFetch from '~/helpers/myFetch';
import C from '@sh/constants';
import { IFePerson, ListPageMode } from '@sh/types';
import Form from '@c/form/Form';
import FormCountrySelect from '@c/form/FormCountrySelect';
import FormTextInput from '@c/form/FormTextInput';
import FormCheckbox from '@c/form/FormCheckbox';
import Country from '@c/Country';
import CreatorDetails from '@c/CreatorDetails';
import { getUserInfo, limitRequests, splitNameAndLocalizedName } from '~/helpers/utilityFunctions';
import { useScrollToTopForNewMessage } from '~/helpers/customHooks';
import { MainContext } from '~/helpers/contexts';
import { IUserInfo } from '~/helpers/interfaces/UserInfo';

const userInfo: IUserInfo = getUserInfo();
const INVALID_WCA_ID_ERROR = 'Please enter a valid WCA ID';

const CreatePersonPage = () => {
  const searchParams = useSearchParams();
  const { setErrorMessages, setSuccessMessage, loadingId, setLoadingId, resetMessagesAndLoadingId } =
    useContext(MainContext);

  const [nextFocusTarget, setNextFocusTarget] = useState('');
  const [mode, setMode] = useState<ListPageMode | 'add-once'>('view');
  const [competitors, setCompetitors] = useState<IFePerson[]>([]);

  const [name, setName] = useState('');
  const [localizedName, setLocalizedName] = useState('');
  const [wcaId, setWcaId] = useState('');
  const [noWcaId, setNoWcaId] = useState(false);
  const [countryIso2, setCountryIso2] = useState('NOT_SELECTED');
  const [fetchPersonDataTimer, setFetchPersonDataTimer] = useState<NodeJS.Timeout>(null);

  useEffect(() => {
    if (searchParams.get('redirect')) setMode('add-once');

    myFetch.get('/persons/mod', { authorize: true }).then(({ payload, errors }) => {
      if (errors) setErrorMessages(errors);
      else setCompetitors(payload);
    });
  }, []);

  useEffect(() => {
    if (nextFocusTarget) {
      document.getElementById(nextFocusTarget)?.focus();
      setNextFocusTarget('');
    }
    // These dependencies are required so that it focuses AFTER everything has been rerendered
  }, [nextFocusTarget, wcaId, name, localizedName, countryIso2, fetchPersonDataTimer]);

  useScrollToTopForNewMessage();

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const handleSubmit = async () => {
    resetMessagesAndLoadingId();

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
      return;
    }

    const person = {
      name: name.trim(),
      localizedName: localizedName.trim() ? localizedName.trim() : undefined,
      wcaId: noWcaId ? undefined : wcaId,
      countryIso2,
    };

    setLoadingId('form_submit_button');
    const { errors } = await myFetch.post('/persons', person);

    if (errors) {
      setErrorMessages(errors);
    } else {
      const redirect = searchParams.get('redirect');

      reset();
      resetMessagesAndLoadingId();
      setSuccessMessage(`${name} successfully added${redirect ? '. Going back...' : ''}`);

      // Redirect if there is a redirect parameter in the URL, otherwise focus the first input
      if (!redirect) {
        if (noWcaId) setNextFocusTarget('full_name');
        else setNextFocusTarget('wca_id');
      } else {
        setTimeout(() => window.location.replace(redirect), 1000); // 1 second delay
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
      resetMessagesAndLoadingId();

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
    resetMessagesAndLoadingId();
  };

  const changeLocalizedName = (value: string) => {
    setLocalizedName(value);
    resetMessagesAndLoadingId();
  };

  const reset = (exceptWcaId = false) => {
    setName('');
    setLocalizedName('');
    setCountryIso2('NOT_SELECTED');
    if (!exceptWcaId) setWcaId('');
  };

  const onAddCompetitor = () => {
    setMode('add');
    resetMessagesAndLoadingId();
  };

  const onEditCompetitor = (person: IFePerson) => {
    setMode('edit');

    const parts = person.name.split(' (');

    setName(parts[0]);
    setLocalizedName(parts[1] ?? '');
    if (person.wcaId) {
      setWcaId(person.wcaId);
      setNoWcaId(false);
    } else {
      setNoWcaId(true);
    }
    setCountryIso2(person.countryIso2);

    resetMessagesAndLoadingId();
  };

  const onCancel = () => {
    setMode('view');
    reset();
  };

  return (
    <div>
      <h2 className="mb-4 text-center">Competitors</h2>

      {mode === 'view' ? (
        <button type="button" className="btn btn-success ms-3" onClick={onAddCompetitor}>
          Add competitor
        </button>
      ) : (
        <Form
          buttonText="Submit"
          onSubmit={handleSubmit}
          showCancelButton={mode !== 'add-once'}
          onCancel={onCancel}
          disableButton={fetchPersonDataTimer !== null}
        >
          <FormTextInput
            title="WCA ID"
            id="wca_id"
            monospace
            value={wcaId}
            setValue={changeWcaId}
            autoFocus
            disabled={loadingId !== '' || noWcaId || fetchPersonDataTimer !== null}
          />
          <FormCheckbox
            title="Competitor doesn't have a WCA ID"
            selected={noWcaId}
            setSelected={changeNoWcaId}
            disabled={loadingId !== '' || fetchPersonDataTimer !== null}
          />
          <FormTextInput
            title="Full Name"
            id="full_name"
            value={name}
            setValue={changeName}
            nextFocusTargetId="localized_name"
            disabled={loadingId !== '' || !noWcaId}
          />
          <FormTextInput
            title="Localized Name (optional)"
            id="localized_name"
            value={localizedName}
            setValue={changeLocalizedName}
            nextFocusTargetId="country_iso_2"
            disabled={loadingId !== '' || !noWcaId}
          />
          <FormCountrySelect
            countryIso2={countryIso2}
            setCountryIso2={setCountryIso2}
            nextFocusTargetId="form_submit_button"
            disabled={loadingId !== '' || !noWcaId}
          />
        </Form>
      )}

      {userInfo.isAdmin && (
        <p className="my-4 px-3">
          Total competitors:&nbsp;<b>{competitors.length}</b>
        </p>
      )}

      {mode !== 'add-once' && (
        <div className="container mb-5 table-responsive">
          <table className="table table-hover text-nowrap">
            <thead>
              <tr>
                <th scope="col">CC ID</th>
                <th scope="col">Name</th>
                <th scope="col">WCA ID</th>
                <th scope="col">Country</th>
                {userInfo.isAdmin && <th scope="col">Created by</th>}
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((person: IFePerson) => (
                <tr key={person.personId}>
                  <td>{person.personId}</td>
                  <td>{person.name}</td>
                  <td>{person.wcaId}</td>
                  <td>
                    <Country countryIso2={person.countryIso2} />
                  </td>
                  {userInfo.isAdmin && (
                    <td>
                      <CreatorDetails creator={person.creator} concise />
                    </td>
                  )}
                  <td>
                    <button
                      type="button"
                      onClick={() => onEditCompetitor(person)}
                      className="btn btn-primary btn-sm"
                      style={{ padding: C.smallButtonPadding }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CreatePersonPage;
