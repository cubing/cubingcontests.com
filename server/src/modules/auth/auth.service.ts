import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IJwtPayload } from '~/src/helpers/interfaces/JwtPayload';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@m/users/users.service';
import { CreateUserDto } from '@m/users/dto/create-user.dto';
import { Role } from '@sh/enums';
import { IPartialUser } from '~/src/helpers/interfaces/User';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  async register(createUserDto: CreateUserDto) {
    try {
      // 10 is the number  of salt rounds
      createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
    } catch (err) {
      throw new InternalServerErrorException(`Error while creating password hash: ${err.message}`);
    }

    await this.usersService.createUser(createUserDto);
  }

  // The user comes from the passport local auth guard (local strategy), which uses the validateUser
  // method below; the user is then saved in the request and passed in from the controller
  async login(user: any) {
    const payload: IJwtPayload = {
      sub: user._id,
      personId: user.persondId,
      username: user.username,
      roles: user.roles,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async validateUser(username: string, password: string): Promise<IPartialUser> {
    const user = await this.usersService.getUser(username);

    if (user) {
      const passwordsMatch = await bcrypt.compare(password, user.password);

      if (passwordsMatch) {
        return {
          _id: user._id,
          personId: user.personId,
          username: user.username,
          roles: user.roles,
        };
      }
    }

    throw new NotFoundException('The username or password is incorrect');
  }

  async revalidate(jwtUser: any) {
    const user: IPartialUser = await this.usersService.getPartialUserById(jwtUser._id);

    const payload: IJwtPayload = {
      sub: user._id as string,
      personId: user.personId,
      username: user.username,
      roles: user.roles,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async getUserRoles(id: string): Promise<Role[]> {
    return await this.usersService.getUserRoles(id);
  }
}
