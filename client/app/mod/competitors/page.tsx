'use client';

import { useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMyFetch } from '~/helpers/customHooks';
import { IFePerson, ListPageMode } from '@sh/types';
import { getUserInfo } from '~/helpers/utilityFunctions';
import { MainContext } from '~/helpers/contexts';
import { IUserInfo } from '~/helpers/interfaces/UserInfo';
import Button from '@c/UI/Button';
import Country from '@c/Country';
import CreatorDetails from '@c/CreatorDetails';
import Competitor from '@c/Competitor';
import PersonForm from './PersonForm';

const userInfo: IUserInfo = getUserInfo();

const CreatePersonPage = () => {
  const searchParams = useSearchParams();
  const myFetch = useMyFetch();
  const { resetMessagesAndLoadingId } = useContext(MainContext);
  const [mode, setMode] = useState<ListPageMode | 'add-once'>(searchParams.get('redirect') ? 'add-once' : 'view');
  const [persons, setPersons] = useState<IFePerson[]>([]);
  const [personUnderEdit, setPersonUnderEdit] = useState<IFePerson>();

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
    setMode('edit');
    setPersonUnderEdit(person);
    resetMessagesAndLoadingId();
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

      {mode === 'view' ? (
        <button type="button" className="btn btn-success ms-3" onClick={onAddCompetitor}>
          Add competitor
        </button>
      ) : (
        <PersonForm
          personUnderEdit={personUnderEdit}
          onSubmit={updateCompetitors}
          onCancel={mode !== 'add-once' ? () => setMode('view') : undefined}
        />
      )}

      {mode !== 'add-once' && (
        <>
          {userInfo.isAdmin && (
            <p className="my-4 px-3">
              Total competitors:&nbsp;<b>{persons.length === 500 ? '500+' : persons.length}</b>
            </p>
          )}

          <div className="container mt-3 mb-5 table-responsive">
            <table className="table table-hover text-nowrap">
              <thead>
                <tr>
                  <th scope="col">CC ID</th>
                  <th scope="col">Name</th>
                  <th scope="col">Localized Name</th>
                  <th scope="col">WCA ID</th>
                  <th scope="col">Country</th>
                  {userInfo.isAdmin && <th scope="col">Created by</th>}
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {persons.map((person: IFePerson) => (
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
                    <td>
                      <Button
                        type="button"
                        text="Edit"
                        onClick={() => onEditCompetitor(person)}
                        disabled={mode !== 'view'}
                        className="btn btn-primary btn-xs"
                      />
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
