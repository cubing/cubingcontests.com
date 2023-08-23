'use client';

import { Role } from '~/shared_helpers/enums';
import AuthorizedLayout from '@c/adminAndModerator/AuthorizedLayout';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return <AuthorizedLayout role={Role.Admin}>{children}</AuthorizedLayout>;
};

export default AdminLayout;
