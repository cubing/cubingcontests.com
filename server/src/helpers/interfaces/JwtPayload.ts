import { Role } from "@sh/enums";

export interface IJwtPayload {
  sub: string; // user id
  personId: number;
  username: string;
  email: string;
  roles: Role[];
}
