'use client';

import { useState, useEffect } from 'react';
import myFetch from '~/helpers/myFetch';
import Loading from '@c/Loading';
import { Role } from '@sh/enums';

const fetchUser = async (role: Role, setAuthorized: (value: boolean) => void) => {
  const { payload } = await myFetch.get(`/auth/validate${role}`, {
    authorize: true,
    redirect: window.location.pathname,
  });

  if (payload) {
    localStorage.setItem(`jwtToken`, `Bearer ${payload.accessToken}`);
    setAuthorized(true);
  }
};

const AuthorizedLayout = ({ role, children }: { role: Role; children: React.ReactNode }) => {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    fetchUser(role, setAuthorized);
  }, [role, setAuthorized]);

  if (authorized) return children;

  return <Loading />;
};

export default AuthorizedLayout;
