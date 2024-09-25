'use client';

import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';
import { remove as removeAccents } from 'remove-accents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPencil, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
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
import FormTextInput from '@c/form/FormTextInput';

const userInfo: IUserInfo = getUserInfo();

const CreatePersonPage = () => {
  const searchParams = useSearchParams();
  const myFetch = useMyFetch();
  const { changeSuccessMessage, loadingId, resetMessagesAndLoadingId } = useContext(MainContext);
  const parentRef = useRef();
  const [mode, setMode] = useState<ListPageMode | 'add-once'>(searchParams.get('redirect') ? 'add-once' : 'view');
  const [persons, setPersons] = useState<IFePerson[]>([]);
  const [personUnderEdit, setPersonUnderEdit] = useState<IFePerson>();
  const [approvedFilter, setApprovedFilter] = useState<'approved' | 'unapproved' | ''>('');
  const [search, setSearch] = useState('');

  const filteredPersons = useMemo(
    () =>
      persons.filter(
        (p) =>
          removeAccents(p.name.toLowerCase()).includes(removeAccents(search.toLowerCase())) &&
          (approvedFilter === '' ||
            (approvedFilter === 'approved' && !p.unapproved) ||
            (approvedFilter === 'unapproved' && p.unapproved)),
      ),
    [persons, approvedFilter, search],
  );

  const approvedFilterOptions: MultiChoiceOption[] = [
    { label: 'Any', value: '' },
    { label: 'Approved', value: 'approved' },
    { label: 'Not approved', value: 'unapproved' },
  ];

  const rowVirtualizer = useVirtualizer({
    count: filteredPersons.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 47, // UPDATE THIS IF THE TR HEIGHT IN PIXELS EVER CHANGES!
    overscan: 20,
  });

  useEffect(() => {
    myFetch.get('/persons/mod', { authorize: true }).then(({ payload, errors }) => {
      if (!errors) setPersons(payload);
    });
  }, []);

  const cancel = () => {
    setMode('view');
    resetMessagesAndLoadingId();
  };

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

  const deleteCompetitor = async (person: IFePerson) => {
    const { errors } = await myFetch.delete(`/persons/${(person as any)._id}`, {
      loadingId: `delete_person_${person.personId}_button`,
    });

    if (!errors) {
      setPersons(persons.filter((p) => (p as any)._id !== (person as any)._id));
      changeSuccessMessage(`Successfully deleted ${person.name} (CC ID: ${person.personId})`);
    }
  };

  const updateCompetitors = (person: IFePerson, isNew = false) => {
    if (isNew) {
      setPersons([person, ...persons]);
    } else {
      setPersons(persons.map((p) => (p.personId === person.personId ? { ...person, creator: p.creator } : p)));
      setMode('view');
    }
  };

  return (
    <section className="flex-grow-1 d-flex flex-column" style={{ maxHeight: '82vh' }}>
      <h2 className="mb-4 text-center">Competitors</h2>
      <ToastMessages />

      {mode === 'view' ? (
        <Button onClick={onAddCompetitor} className="btn-success btn-sm ms-3" style={{ width: 'fit-content' }}>
          Add competitor
        </Button>
      ) : (
        <PersonForm
          personUnderEdit={personUnderEdit}
          onSubmit={updateCompetitors}
          onCancel={mode !== 'add-once' ? cancel : undefined}
        />
      )}

      {mode !== 'add-once' && (
        <>
          <div className="d-flex flex-wrap align-items-center column-gap-3 mt-4 px-3">
            <FormTextInput title="Search" value={search} setValue={setSearch} oneLine />
            <FormSelect
              title="Status"
              selected={approvedFilter}
              setSelected={setApprovedFilter}
              options={approvedFilterOptions}
              oneLine
              style={{ maxWidth: '15rem' }}
            />
          </div>

          <p className="mb-2 px-3">
            Number of competitors:&nbsp;<b>{filteredPersons.length}</b>
          </p>

          <div ref={parentRef} className="flex-grow-1 mt-3 table-responsive overflow-y-auto">
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
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
                  {rowVirtualizer.getVirtualItems().map((virtualItem, index) => {
                    if (filteredPersons.length === 0) return;
                    const person = filteredPersons[virtualItem.index];

                    return (
                      <tr
                        key={virtualItem.key as React.Key}
                        style={{
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start - index * virtualItem.size}px)`,
                        }}
                      >
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
                          <div className="d-flex gap-2">
                            {(userInfo.isAdmin || person.unapproved) && (
                              <Button
                                onClick={() => onEditCompetitor(person)}
                                disabled={mode !== 'view'}
                                className="btn-xs"
                                ariaLabel="Edit"
                              >
                                <FontAwesomeIcon icon={faPencil} />
                              </Button>
                            )}
                            {userInfo.isAdmin && person.unapproved && (
                              <Button
                                id={`delete_person_${person.personId}_button`}
                                onClick={() => deleteCompetitor(person)}
                                loadingId={loadingId}
                                disabled={mode !== 'view'}
                                className="btn-xs btn-danger"
                                ariaLabel="Delete"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default CreatePersonPage;
