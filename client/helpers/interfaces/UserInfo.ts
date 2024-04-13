import { Role } from '@sh/enums';

export interface IUserInfo {
  id: string;
  username: string;
  roles: Role[];
  isAdmin: boolean;
  isMod: boolean;
}
