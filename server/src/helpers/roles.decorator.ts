import { SetMetadata } from "@nestjs/common";
import { Role } from "@sh/enums";

export const Roles = (...roles: Role[]) => SetMetadata("roles", roles);
