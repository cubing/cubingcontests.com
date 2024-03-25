import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '@m/users/users.service';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { CreateUserDto } from '@m/users/dto/create-user.dto';
import { LocalAuthGuard } from '~/src/guards/local-auth.guard';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '@sh/enums';
import { LogType } from '~/src/helpers/enums';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly logger: MyLogger,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  // POST /auth/register
  @Post('register')
  async register(@Body(new ValidationPipe()) createUserDto: CreateUserDto) {
    this.logger.logAndSave('Registering new user', LogType.Register);

    return await this.authService.register(createUserDto);
  }

  // POST /auth/confirm-email
  @Post('confirm-email')
  async confirmEmail(@Body(new ValidationPipe()) { username, code }: { username: string; code: string }) {
    this.logger.logAndSave('Confirming user email', LogType.ConfirmEmail);

    return await this.usersService.verifyEmail(username, code);
  }

  // POST /auth/resend-confirmation-code
  @Post('resend-confirmation-code')
  async resendConfirmationCode(@Body(new ValidationPipe()) { username }: { username: string }) {
    this.logger.log(`Resending confirmation code for user ${username}`);

    return await this.usersService.resendConfirmationCode(username);
  }

  // POST /auth/login
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Request() req: any) {
    return await this.authService.login(req.user);
  }

  // GET /auth/validate/:role
  @Get('validate/:role')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator, Role.User)
  async validate(@Param('role') role: Role, @Request() req: any) {
    // Return refreshed JWT
    if (req.user.roles.includes(role)) return await this.authService.revalidate(req.user);

    throw new UnauthorizedException();
  }
}
