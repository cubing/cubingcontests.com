import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AuthService } from "@m/auth/auth.service";

@Injectable()
export class AuthTokenGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split("Bearer ")[1];

    if (!token || !request.body?.competitionWcaId) return false;

    return await this.authService.validateAuthToken(token, request.body.competitionWcaId);
  }
}
