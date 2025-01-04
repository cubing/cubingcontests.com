"use client";

import AuthorizedLayout from "~/app/components/AuthorizedLayout.tsx";
import { Role } from "@cc/shared";

// This layout is almost the same as the mod and user layouts

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return <AuthorizedLayout role={Role.Admin}>{children}</AuthorizedLayout>;
};

export default AdminLayout;
