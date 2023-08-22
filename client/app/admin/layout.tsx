'use client';

import React, { useState, useEffect } from 'react';
import myFetch from '~/helpers/myFetch';
import Loading from '@c/Loading';

const fetchAdminUser = async (setAuthorized: (value: boolean) => void) => {
  const { payload } = await myFetch.get('/auth/validateadmin', { authorize: true, redirect: 'admin' });

  if (payload) {
    localStorage.setItem('jwtToken', `Bearer ${payload.accessToken}`);
    setAuthorized(true);
  }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    fetchAdminUser(setAuthorized);
  }, [setAuthorized]);

  if (!authorized) return <Loading />;

  return children;
}
