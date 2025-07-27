import { Role } from "~/helpers/enums.ts";

export interface IJwtPayload {
  sub: string; // user id
  personId: number;
  username: string;
  email: string;
  roles: Role[];
}
