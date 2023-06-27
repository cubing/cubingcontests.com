import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// This one is only used by the login endpoint in the auth controller
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
