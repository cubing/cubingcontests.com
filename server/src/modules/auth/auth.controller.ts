import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '@m/users/dto/create-user.dto';
import { LocalAuthGuard } from '~/src/guards/local-auth.guard';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '~/src/helpers/enums';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body(new ValidationPipe()) createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UseGuards(LocalAuthGuard)
  login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @Get('validateadmin')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  validateAdmin(@Request() req: any) {
    return {
      id: req.user.id,
      username: req.user.username,
    };
  }
}
