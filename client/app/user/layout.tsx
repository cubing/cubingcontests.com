"use client";

import AuthorizedLayout from "~/app/components/AuthorizedLayout.tsx";
import { Role } from "~/shared_helpers/enums.ts";

// This layout is almost the same as the admin and mod layouts

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  return <AuthorizedLayout role={Role.User}>{children}</AuthorizedLayout>;
};

export default UserLayout;
