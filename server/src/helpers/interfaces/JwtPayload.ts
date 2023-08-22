import { Role } from '../enums';

export interface IJwtPayload {
  sub: string; // user id
  personId: number;
  username: string;
  roles: Role[];
}
