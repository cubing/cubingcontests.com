"use client";

import { useEffect, useState } from "react";
import { useMyFetch } from "~/helpers/customHooks.ts";
import Loading from "~/app/components/UI/Loading.tsx";
import { Role } from "@cc/shared";

type Props = {
  role: Role;
  children: React.ReactNode;
};

const AuthorizedLayout = ({ role, children }: Props) => {
  const myFetch = useMyFetch();

  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    myFetch
      .get(`/auth/validate/${role}`, { authorize: true, redirect: window.location.pathname })
      .then(({ payload }) => {
        if (payload) {
          localStorage.setItem("jwtToken", `Bearer ${payload.accessToken}`);
          setAuthorized(true);
        }
      });
  }, []);

  if (authorized) return children;

  return <Loading />;
};

export default AuthorizedLayout;
