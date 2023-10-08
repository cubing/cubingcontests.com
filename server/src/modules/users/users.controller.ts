import { Body, Controller, Get, Patch, UseGuards, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '@sh/enums';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles(Role.Admin)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUsers() {
    return await this.usersService.getUsers();
  }

  @Patch()
  async updateUser(@Body(new ValidationPipe()) user: UpdateUserDto) {
    return await this.usersService.updateUser(user);
  }
}
