import { Role } from '@sh/enums';

export interface IUserInfo {
  username: string;
  roles: Role[];
  isAdmin: boolean;
  isMod: boolean;
}
