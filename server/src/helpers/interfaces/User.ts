import { Role } from '@sh/enums';

export interface IPartialUser {
  _id?: unknown;
  personId?: number; // assigned manually by an admin
  username: string;
  roles?: Role[]; // optional, because it's not needed for the create DTO, it's set by the backend automatically
}

export interface IUser extends IPartialUser {
  email: string;
  password: string;
  confirmationCodeHash?: string;
  confirmationCodeAttempts?: number; // the number of times the user has attempted to enter the code
  cooldownStarted?: Date;
}
