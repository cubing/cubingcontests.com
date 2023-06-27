'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '~/helpers/configuration';
import Loading from '~/app/components/Loading';

const fetchAdminUser = async (jwtToken: string, setAdminUser: any) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/validateadmin`, {
      headers: {
        Authorization: jwtToken,
      },
    });
    const json = await res.json();

    if (json.username) {
      setAdminUser(json);
    } else {
      window.location.href = '/login';
    }
  } catch (err) {
    console.error(err);
  }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const jwtToken = localStorage.getItem('jwtToken');

    if (jwtToken) {
      fetchAdminUser(jwtToken, setAdminUser);
    } else {
      window.location.href = '/login';
    }
  }, [setAdminUser]);

  if (!adminUser) {
    return <Loading />;
  }

  return children;
}
