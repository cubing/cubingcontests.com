import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@m/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './dto/sign-in.dto';
import { CreateUserDto } from '@m/users/dto/create-user.dto';
import { UserDocument } from '~/src/models/user.model';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  async register(createUserDto: CreateUserDto) {
    await this.usersService.createUser(createUserDto);
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.usersService.getUser(signInDto.username);

    if (user?.password !== signInDto.password) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user._id, username: user.username };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
