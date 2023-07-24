import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '~/src/helpers/interfaces/JwtPayload';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@m/users/users.service';
import { CreateUserDto } from '@m/users/dto/create-user.dto';
import { Role } from '~/src/helpers/enums';

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

  // The user comes from the passport local auth guard (local strategy) and is passed in from the controller
  async login(user: any) {
    const payload: JwtPayload = { sub: user._id, personId: user.persondId };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.getUser(username);

    if (user) {
      const passwordsMatch = await bcrypt.compare(password, user.password);

      if (passwordsMatch) {
        return {
          _id: user._id,
          persondId: user.personId,
          username: user.username,
        };
      }
    }

    throw new NotFoundException('The username or password is incorrect');
  }

  async getUserRoles(id: string): Promise<Role[]> {
    return await this.usersService.getUserRoles(id);
  }
}
