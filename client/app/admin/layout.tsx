'use client';

import { Role } from '@sh/enums';
import AuthorizedLayout from '@c/adminAndModerator/AuthorizedLayout';

// This layout is almost the same as the mod layout

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return <AuthorizedLayout role={Role.Admin}>{children}</AuthorizedLayout>;
};

export default AdminLayout;
