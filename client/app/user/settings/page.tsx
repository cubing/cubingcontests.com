'use client';

import { useEffect, useState } from 'react';
import myFetch from '~/helpers/myFetch';
import ErrorMessages from '@c/UI/ErrorMessages';
import Competitor from '@c/Competitor';
import { IFrontendUser } from '@sh/interfaces';
import { getRoleLabel } from '@sh/sharedFunctions';
import { Role } from '@sh/enums';
import { IUserInfo } from '~/helpers/interfaces/UserInfo';
import { getUserInfo } from '~/helpers/utilityFunctions';

const userInfo: IUserInfo = getUserInfo();

const UserSettingsPage = () => {
  const [errorMessages, setErrorMessages] = useState([]);
  const [user, setUser] = useState<IFrontendUser>();

  const filteredRoles = user?.roles?.filter((r) => r !== Role.User) ?? [];

  useEffect(() => {
    myFetch.get(`/users/${userInfo.id}`, { authorize: true }).then(({ payload, errors }) => {
      if (errors) setErrorMessages(errors);
      else setUser(payload);
    });
  }, []);

  return (
    <div>
      <h2 className="mb-4 text-center">Settings</h2>

      <ErrorMessages errorMessages={errorMessages} />

      {user && (
        <>
          <p>
            Email address: <b>{user.email}</b>
          </p>
          {user.person ? (
            <p className="d-flex gap-2">
              Your competitor profile: <Competitor person={user.person} showLocalizedName />
            </p>
          ) : (
            <p>There is no competitor tied to your account.</p>
          )}
          {filteredRoles.length > 0 && (
            <p>
              Your roles:{' '}
              {filteredRoles.map((r, i) => (
                <span key={r}>
                  {i !== 0 && <span>, </span>}
                  <b>{getRoleLabel(r, true)}</b>
                </span>
              ))}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default UserSettingsPage;
