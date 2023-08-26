'use client';

import { Role } from '@sh/enums';
import AuthorizedLayout from '@c/adminAndModerator/AuthorizedLayout';

// This layout is almost the same as the admin layout

const ModLayout = ({ children }: { children: React.ReactNode }) => {
  return <AuthorizedLayout role={Role.Moderator}>{children}</AuthorizedLayout>;
};

export default ModLayout;
