import { Body, Controller, Get, Param, Patch, UseGuards, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '@sh/enums';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users
  @Get()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async getUsers() {
    return await this.usersService.getUsers();
  }

  // PATCH /users
  @Patch()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async updateUser(@Body(new ValidationPipe()) user: UpdateUserDto) {
    return await this.usersService.updateUser(user);
  }

  // GET /users/:id
  @Get(':id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.User)
  async getUserDetails(@Param('id') id: string) {
    return await this.usersService.getUserDetails(id);
  }
}
