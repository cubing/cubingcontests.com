import { Role } from '../enums';

export interface IPartialUser {
  _id?: unknown;
  personId?: number; // assigned manually by an admin
  username: string;
  // Optional, because roles are not assigned on creation; they are assigned manually.
  // This is REQUIRED in the user model.
  roles?: Role[];
}

export interface IUser extends IPartialUser {
  email: string;
  password: string;
}
