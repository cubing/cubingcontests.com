import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@sh/enums";
import { AuthService } from "@m/auth/auth.service";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>("roles", [context.getHandler(), context.getClass()]);

    // Makes endpoints that DON'T have a @Roles() decorator accessible
    if (!requiredRoles) return true;

    // Receive the user from the request (coming from the Authenticated (JWT strategy) guard)
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      console.error("No user passed into the roles guard!");
      return false;
    }

    user.roles = await this.authService.getUserRoles(user._id);

    if (!user.roles) return false;

    return requiredRoles.some((role) => user.roles.includes(role));
  }
}
