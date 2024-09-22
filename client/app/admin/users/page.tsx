'use client';

import { useContext, useEffect, useState } from 'react';
import { useMyFetch } from '~/helpers/customHooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil } from '@fortawesome/free-solid-svg-icons';
import { Role } from '@sh/enums';
import { IFeUser } from '@sh/types';
import { getRoleLabel } from '@sh/sharedFunctions';
import { MainContext } from '~/helpers/contexts';
import Form from '@c/form/Form';
import FormTextInput from '@c/form/FormTextInput';
import FormPersonInputs from '@c/form/FormPersonInputs';
import FormCheckbox from '@c/form/FormCheckbox';
import Button from '@c/UI/Button';
import ToastMessages from '@c/UI/ToastMessages';

const ManageUsersPage = () => {
  const myFetch = useMyFetch();
  const { changeErrorMessages, loadingId, resetMessagesAndLoadingId } = useContext(MainContext);

  const [users, setUsers] = useState<IFeUser[]>([]);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [personNames, setPersonNames] = useState(['']);
  const [persons, setPersons] = useState([null]);
  const [isUser, setIsUser] = useState(false);
  const [isMod, setIsMod] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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

    const newUser: IFeUser = {
      username,
      email,
      person: persons[0] ?? undefined,
      roles: [],
    };

    if (isUser) newUser.roles.push(Role.User);
    if (isMod) newUser.roles.push(Role.Moderator);
    if (isAdmin) newUser.roles.push(Role.Admin);

    const { payload, errors } = await myFetch.patch('/users', newUser, { loadingId: 'form_submit_button' });

    if (!errors) {
      setUsername('');
      setUsers(users.map((u) => (u.username === newUser.username ? payload : u)));
    }
  };

  const onEditUser = async (user: IFeUser) => {
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
    <div>
      <h2 className="mb-4 text-center">Users</h2>
      <ToastMessages />

      {username && (
        <Form buttonText="Submit" onSubmit={handleSubmit} hideToasts showCancelButton onCancel={() => setUsername('')}>
          <div className="row">
            <div className="col">
              <FormTextInput title="Username" value={username} disabled />
            </div>
            <div className="col">
              <FormTextInput title="Email" value={email} setValue={setEmail} />
            </div>
          </div>
          <FormPersonInputs
            title="Competitor"
            persons={persons}
            setPersons={setPersons}
            personNames={personNames}
            setPersonNames={setPersonNames}
          />
          <h5 className="mb-4">Roles</h5>
          <FormCheckbox title="User" selected={isUser} setSelected={setIsUser} disabled={loadingId !== ''} />
          <FormCheckbox title="Moderator" selected={isMod} setSelected={setIsMod} disabled={loadingId !== ''} />
          <FormCheckbox title="Admin" selected={isAdmin} setSelected={setIsAdmin} disabled />
        </Form>
      )}

      <div className="my-5 table-responsive">
        <table className="table table-hover text-nowrap">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Username</th>
              <th scope="col">Email</th>
              <th scope="col">Competitor</th>
              <th scope="col">Roles</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: IFeUser, index) => (
              <tr key={user.username}>
                <td>{index + 1}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.person?.name}</td>
                <td>{user.roles.map((r) => getRoleLabel(r, true)).join(', ')}</td>
                <td>
                  <Button
                    id={`edit_${user.username}_button`}
                    type="button"
                    onClick={() => onEditUser(user)}
                    className="btn-xs"
                    ariaLabel="Edit"
                  >
                    <FontAwesomeIcon icon={faPencil} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsersPage;
