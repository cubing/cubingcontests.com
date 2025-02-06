import { Role } from "~/helpers/enums.ts";

export type UserInfo = undefined | {
  id: string;
  username: string;
  personId?: number;
  roles: Role[];
  isAdmin: boolean;
  isMod: boolean;
};
