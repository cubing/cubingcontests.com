'use client';

import AuthorizedLayout from '@c/AuthorizedLayout';
import { Role } from '@sh/enums';

// This layout is almost the same as the admin and user layouts

const ModLayout = ({ children }: { children: React.ReactNode }) => {
  return <AuthorizedLayout role={Role.Moderator}>{children}</AuthorizedLayout>;
};

export default ModLayout;
