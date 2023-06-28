'use client';

import React, { useState, useEffect } from 'react';
import myFetch from '~/helpers/myFetch';
import Loading from '~/app/components/Loading';

const fetchAdminUser = async (setAdminUser: any) => {
  const admin = await myFetch.getAdmin();

  if (admin) {
    setAdminUser(admin);
  }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    fetchAdminUser(setAdminUser);
  }, [setAdminUser]);

  if (!adminUser) {
    return <Loading />;
  }

  return children;
}
