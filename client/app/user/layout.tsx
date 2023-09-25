'use client';

import AuthorizedLayout from '@c/AuthorizedLayout';
import { Role } from '@sh/enums';

// This layout is almost the same as the admin and mod layouts

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  return <AuthorizedLayout role={Role.User}>{children}</AuthorizedLayout>;
};

export default UserLayout;
