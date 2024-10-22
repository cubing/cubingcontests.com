"use client";

import AuthorizedLayout from "~/app/components/AuthorizedLayout.tsx";
import { Role } from "../../shared_helpers/enums.ts";

// This layout is almost the same as the admin and user layouts

const ModLayout = ({ children }: { children: React.ReactNode }) => {
  return <AuthorizedLayout role={Role.Moderator}>{children}</AuthorizedLayout>;
};

export default ModLayout;
