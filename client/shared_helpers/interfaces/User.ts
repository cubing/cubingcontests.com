import { Role } from "../enums.ts";
import { IPerson } from "../types.ts";

export interface IFeUser {
  username: string;
  email: string;
  roles?: Role[];
  person?: IPerson;
}
