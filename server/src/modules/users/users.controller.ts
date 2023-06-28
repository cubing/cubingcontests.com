import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '@sh/enums';
import { UsersService } from './users.service';

// All endpoints in this controller must only be accessible to the admin user
@Controller('users')
@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles(Role.Admin)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('total')
  async getUsersTotal() {
    return {
      total: await this.usersService.getUsersTotal(),
    };
  }
}
