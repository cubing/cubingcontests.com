import { Role } from '../enums';

export interface IUser {
  personId?: number; // assigned manually by an admin
  username: string;
  email: string;
  password: string;
  // Optional, because roles are not assigned on creation; they are assigned manually
  roles?: Role[];
}
