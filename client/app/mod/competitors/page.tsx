'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPencil, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useMyFetch } from '~/helpers/customHooks';
import { IFePerson, ListPageMode } from '@sh/types';
import { getUserInfo } from '~/helpers/utilityFunctions';
import { MainContext } from '~/helpers/contexts';
import { IUserInfo } from '~/helpers/interfaces/UserInfo';
import { MultiChoiceOption } from '~/helpers/interfaces/MultiChoiceOption';
import Button from '@c/UI/Button';
import Country from '@c/Country';
import CreatorDetails from '@c/CreatorDetails';
import Competitor from '@c/Competitor';
import ToastMessages from '@c/UI/ToastMessages';
import PersonForm from './PersonForm';
import FormSelect from '@c/form/FormSelect';

const userInfo: IUserInfo = getUserInfo();

const CreatePersonPage = () => {
  const searchParams = useSearchParams();
  const myFetch = useMyFetch();
  const { resetMessagesAndLoadingId } = useContext(MainContext);
  const [mode, setMode] = useState<ListPageMode | 'add-once'>(searchParams.get('redirect') ? 'add-once' : 'view');
  const [persons, setPersons] = useState<IFePerson[]>([]);
  const [personUnderEdit, setPersonUnderEdit] = useState<IFePerson>();
  const [approvedFilter, setApprovedFilter] = useState<'approved' | 'unapproved' | ''>('');

  const filteredPersons = useMemo(
    () =>
      persons.filter(
        (p) =>
          approvedFilter === '' ||
          (approvedFilter === 'approved' && !p.unapproved) ||
          (approvedFilter === 'unapproved' && p.unapproved),
      ),
    [persons, approvedFilter],
  );

  const approvedFilterOptions: MultiChoiceOption[] = [
    { label: 'Any', value: '' },
    { label: 'Approved', value: 'approved' },
    { label: 'Not approved', value: 'unapproved' },
  ];

  useEffect(() => {
    myFetch.get('/persons/mod', { authorize: true }).then(({ payload, errors }) => {
      if (!errors) setPersons(payload);
    });
  }, []);

  const onAddCompetitor = () => {
    setMode('add');
    setPersonUnderEdit(undefined);
    resetMessagesAndLoadingId();
  };

  const onEditCompetitor = (person: IFePerson) => {
    resetMessagesAndLoadingId();
    setMode('edit');
    setPersonUnderEdit(person);
    window.scrollTo(0, 0);
  };

  const updateCompetitors = (person: IFePerson, isNew = false) => {
    if (isNew) {
      setPersons([person, ...persons]);
    } else {
      setPersons(persons.map((c) => (c.personId === person.personId ? { ...person, creator: c.creator } : c)));
      setMode('view');
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-center">Competitors</h2>
      <ToastMessages />

      {mode === 'view' ? (
        <Button onClick={onAddCompetitor} className="btn-success btn-sm ms-3">
          Add competitor
        </Button>
      ) : (
        <PersonForm
          personUnderEdit={personUnderEdit}
          onSubmit={updateCompetitors}
          onCancel={mode !== 'add-once' ? () => setMode('view') : undefined}
        />
      )}

      {mode !== 'add-once' && (
        <>
          <div className="mt-4 mb-2 px-3">
            <FormSelect
              title="Status"
              selected={approvedFilter}
              setSelected={setApprovedFilter}
              options={approvedFilterOptions}
              oneLine
              style={{ maxWidth: '16rem' }}
            />
          </div>

          <p className="my-3 px-3">
            Number of competitors:&nbsp;<b>{filteredPersons.length}</b>
          </p>

          <div className="container mt-3 table-responsive">
            <table className="table table-hover text-nowrap">
              <thead>
                <tr>
                  <th scope="col">CC ID</th>
                  <th scope="col">Name</th>
                  <th scope="col">Localized Name</th>
                  <th scope="col">WCA ID</th>
                  <th scope="col">Country</th>
                  {userInfo.isAdmin && <th scope="col">Created by</th>}
                  <th scope="col">Approved</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersons.map((person: IFePerson) => (
                  <tr key={person.personId}>
                    <td>{person.personId}</td>
                    <td>
                      <Competitor person={person} noFlag />
                    </td>
                    <td>{person.localizedName}</td>
                    <td>{person.wcaId}</td>
                    <td>
                      <Country countryIso2={person.countryIso2} shorten />
                    </td>
                    {userInfo.isAdmin && (
                      <td>
                        <CreatorDetails creator={person.creator} small loggedInUser={userInfo} />
                      </td>
                    )}
                    <td className="fs-5">
                      {person.unapproved ? (
                        <FontAwesomeIcon icon={faXmark} className="text-danger" />
                      ) : (
                        <FontAwesomeIcon icon={faCheck} />
                      )}
                    </td>
                    <td>
                      {(person.unapproved || userInfo.isAdmin) && (
                        <Button
                          onClick={() => onEditCompetitor(person)}
                          disabled={mode !== 'view'}
                          className="btn-xs"
                          ariaLabel="Edit"
                        >
                          <FontAwesomeIcon icon={faPencil} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default CreatePersonPage;
