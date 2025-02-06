import { SetMetadata } from "@nestjs/common";
import { Role } from "~/helpers/enums";

export const Roles = (...roles: Role[]) => SetMetadata("roles", roles);
