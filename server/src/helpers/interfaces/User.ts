import { Role } from "~/shared/enums";

export interface IPartialUser {
  _id?: unknown;
  personId?: number; // assigned manually by an admin
  username: string;
  email: string;
  roles: Role[];
}

export interface IUser extends IPartialUser {
  password: string;
  confirmationCodeHash?: string;
  confirmationCodeAttempts?: number; // the number of times the user has attempted to enter the code
  cooldownStarted?: Date;
  passwordResetCodeHash?: string;
  passwordResetStarted?: Date;
}
