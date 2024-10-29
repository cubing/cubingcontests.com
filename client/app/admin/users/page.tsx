'use client';

import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { capitalize } from 'lodash';
import { useMyFetch } from '~/helpers/customHooks.ts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil } from '@fortawesome/free-solid-svg-icons';
import { Role } from '~/shared_helpers/enums.ts';
import { IFeUser } from '~/shared_helpers/types.ts';
import { getRoleLabel, getSimplifiedString } from '~/shared_helpers/sharedFunctions.ts';
import { MainContext } from '~/helpers/contexts.ts';
import Form from '~/app/components/form/Form.tsx';
import FormTextInput from '~/app/components/form/FormTextInput.tsx';
import FormPersonInputs from '~/app/components/form/FormPersonInputs.tsx';
import FormCheckbox from '~/app/components/form/FormCheckbox.tsx';
import Button from '~/app/components/UI/Button.tsx';
import ToastMessages from '~/app/components/UI/ToastMessages.tsx';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { InputPerson } from '~/helpers/types.ts';

const ManageUsersPage = () => {
  const myFetch = useMyFetch();
  const { changeErrorMessages, loadingId, resetMessagesAndLoadingId } = useContext(MainContext);
  const parentRef = useRef<Element>(null);

  const [users, setUsers] = useState<IFeUser[]>([]);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [personNames, setPersonNames] = useState(['']);
  const [persons, setPersons] = useState<InputPerson[]>([null]);
  const [isUser, setIsUser] = useState(false);
  const [isMod, setIsMod] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState('');

  const filteredUsers = useMemo(() => {
    const simplifiedSearch = getSimplifiedString(search);

    return users.filter(
      (u: IFeUser) =>
        u.username.toLocaleLowerCase().includes(simplifiedSearch) ||
        (u.person && getSimplifiedString(u.person.name).includes(simplifiedSearch)),
    );
  }, [users, search]);

  const rowVirtualizer = useVirtualizer({
    count: filteredUsers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 43.4167, // UPDATE THIS IF THE TR HEIGHT IN PIXELS EVER CHANGES!
    overscan: 20,
  });

  useEffect(() => {
    myFetch.get('/users', { authorize: true }).then(({ payload, errors }) => {
      if (!errors) setUsers(payload);
    });
  }, []);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const handleSubmit = async () => {
    if (persons[0] === null && personNames[0].trim() !== '') {
      changeErrorMessages(['The competitor has not been entered. Either enter them or clear the input.']);
      return;
    }

    const newUser: IFeUser = { username, email, person: persons[0] ?? undefined, roles: [] };

    if (isUser) newUser.roles.push(Role.User);
    if (isMod) newUser.roles.push(Role.Moderator);
    if (isAdmin) newUser.roles.push(Role.Admin);

    const { payload, errors } = await myFetch.patch('/users', newUser, { loadingId: 'form_submit_button' });

    if (!errors) {
      setUsername('');
      setUsers(users.map((u: IFeUser) => (u.username === newUser.username ? payload : u)));
    }
  };

  const onEditUser = (user: IFeUser) => {
    window.scrollTo(0, 0);
    resetMessagesAndLoadingId();

    setUsername(user.username);
    setEmail(user.email);
    setIsUser(user.roles.includes(Role.User));
    setIsMod(user.roles.includes(Role.Moderator));
    setIsAdmin(user.roles.includes(Role.Admin));

    if (user.person) {
      setPersons([user.person]);
      setPersonNames([user.person.name]);
    } else {
      setPersons([null]);
      setPersonNames(['']);
    }
  };

  return (
    <section>
      <h2 className='mb-4 text-center'>Users</h2>
      <ToastMessages />

      {username && (
        <Form
          buttonText='Submit'
          onSubmit={handleSubmit}
          hideToasts
          showCancelButton
          onCancel={() => setUsername('')}
        >
          <div className='row mb-3'>
            <div className='col'>
              <FormTextInput title='Username' value={username} disabled />
            </div>
            <div className='col'>
              <FormTextInput title='Email' value={email} setValue={setEmail} />
            </div>
          </div>
          <FormPersonInputs
            title='Competitor'
            persons={persons}
            setPersons={setPersons}
            personNames={personNames}
            setPersonNames={setPersonNames}
          />
          <h5 className='mb-4'>Roles</h5>
          <FormCheckbox
            title='User'
            selected={isUser}
            setSelected={setIsUser}
            disabled={loadingId !== ''}
          />
          <FormCheckbox
            title='Moderator'
            selected={isMod}
            setSelected={setIsMod}
            disabled={loadingId !== ''}
          />
          <FormCheckbox
            title='Admin'
            selected={isAdmin}
            setSelected={setIsAdmin}
            disabled
          />
        </Form>
      )}

      {/* Same styling as the filters on the manage competitors page */}
      <div className='d-flex flex-wrap align-items-center column-gap-3 mt-4 mb-3 px-3'>
        <FormTextInput title='Search' value={search} setValue={setSearch} oneLine />
      </div>

      <p className='mb-2 px-3'>
        Number of users:&nbsp;<b>{filteredUsers.length}</b>
      </p>

      <div ref={parentRef as any} className='mt-3 table-responsive overflow-y-auto' style={{ height: '650px' }}>
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
          <table className='table table-hover text-nowrap'>
            <thead>
              <tr>
                <th scope='col'>#</th>
                <th scope='col'>Username</th>
                <th scope='col'>Email</th>
                <th scope='col'>Competitor</th>
                <th scope='col'>Roles</th>
                <th scope='col'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rowVirtualizer.getVirtualItems().map((virtualItem, index) => {
                if (filteredUsers?.length === 0) return;
                const user = filteredUsers[virtualItem.index];

                return (
                  <tr
                    key={virtualItem.key as React.Key}
                    style={{
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start - index * virtualItem.size}px)`,
                    }}
                  >
                    <td>{virtualItem.index + 1}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.person?.name}</td>
                    <td>{user.roles.map((r: Role) => capitalize(getRoleLabel(r))).join(', ')}</td>
                    <td>
                      <Button
                        id={`edit_${user.username}_button`}
                        type='button'
                        onClick={() => onEditUser(user)}
                        className='btn-xs'
                        ariaLabel='Edit'
                      >
                        <FontAwesomeIcon icon={faPencil} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ManageUsersPage;
