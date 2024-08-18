'use client';

import { useState, useEffect } from 'react';
import { useMyFetch } from '~/helpers/customHooks';
import Loading from '@c/UI/Loading';
import { Role } from '@sh/enums';

const AuthorizedLayout = ({ role, children }: { role: Role; children: React.ReactNode }) => {
  const myFetch = useMyFetch();

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
