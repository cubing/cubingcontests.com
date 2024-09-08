import { Role } from '@sh/enums';

export interface IUserInfo {
  id: string;
  username: string;
  personId?: number;
  roles: Role[];
  isAdmin: boolean;
  isMod: boolean;
}
