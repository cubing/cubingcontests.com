import { Body, Controller, Delete, Get, Patch, Request, UseGuards, ValidationPipe } from "@nestjs/common";
import { UsersService } from "./users.service";
import { MyLogger } from "@m/my-logger/my-logger.service";
import { AuthenticatedGuard } from "~/src/guards/authenticated.guard";
import { RolesGuard } from "~/src/guards/roles.guard";
import { Roles } from "~/src/helpers/roles.decorator";
import { LogType } from "~/src/helpers/enums";
import { Role } from "~/helpers/enums";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller("users")
export class UsersController {
  constructor(
    private readonly logger: MyLogger,
    private readonly usersService: UsersService,
  ) {}

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
    this.logger.logAndSave(
      `Updating user with username: ${user.username}`,
      LogType.UpdateUser,
    );

    return await this.usersService.updateUser(user);
  }

  // GET /users/details
  @Get("details")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.User)
  async getUserDetails(@Request() req: any) {
    return await this.usersService.getUserDetails(req.user._id);
  }

  // DELETE /users
  @Delete()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.User)
  async deleteUser(@Request() req: any) {
    this.logger.logAndSave(
      `Deleting user with username: ${req.user.username}`,
      LogType.DeleteUser,
    );

    return await this.usersService.deleteUser(req.user._id);
  }
}
