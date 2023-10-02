'use client';

import { useState, useEffect } from 'react';
import myFetch from '~/helpers/myFetch';
import Loading from '@c/Loading';
import { Role } from '@sh/enums';

const AuthorizedLayout = ({ role, children }: { role: Role; children: React.ReactNode }) => {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    myFetch
      .get(`/auth/validate/${role}`, { authorize: true, redirect: window.location.pathname })
      .then(({ payload }) => {
        if (payload) {
          localStorage.setItem('jwtToken', `Bearer ${payload.accessToken}`);
          setAuthorized(true);
        }
      });
  }, []);

  if (authorized) return children;

  return <Loading />;
};

export default AuthorizedLayout;
