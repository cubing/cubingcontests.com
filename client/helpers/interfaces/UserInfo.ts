import { Role } from '~/shared_helpers/enums.ts';

export interface IUserInfo {
  id: string;
  username: string;
  personId?: number;
  roles: Role[];
  isAdmin: boolean;
  isMod: boolean;
}
