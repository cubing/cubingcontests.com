import { Role } from "@cc/shared";

export type UserInfo = undefined | {
  id: string;
  username: string;
  personId?: number;
  roles: Role[];
  isAdmin: boolean;
  isMod: boolean;
};
