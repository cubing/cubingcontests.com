import { SetMetadata } from "@nestjs/common";
import { Role } from "~/shared/enums";

export const Roles = (...roles: Role[]) => SetMetadata("roles", roles);
