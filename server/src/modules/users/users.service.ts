import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from '~/src/models/user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '~/src/helpers/enums';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly model: Model<UserDocument>) {}

  // WARNING: this method returns the hashed password too. It is ONLY to be used in the auth module.
  async getUser(username: string) {
    try {
      const user: UserDocument = await this.model.findOne({ username }).exec();

      if (user) {
        return {
          _id: user._id,
          personId: user.personId,
          username: user.username,
          email: user.email,
          password: user.password,
          roles: user.roles,
        };
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // WARNING: this expects that the password is ALREADY encrypted! That is done in the auth module.
  async createUser(createUserDto: CreateUserDto) {
    try {
      const sameIdUser: UserDocument = await this.model.findOne({ personId: createUserDto.personId }).exec();
      if (sameIdUser) {
        throw new BadRequestException('User with that name already exists');
      }

      const sameUsernameUser: UserDocument = await this.model.findOne({ username: createUserDto.username }).exec();
      if (sameUsernameUser) {
        throw new BadRequestException(`User with username ${createUserDto.username} already exists`);
      }

      const sameEmailUser: UserDocument = await this.model.findOne({ email: createUserDto.email }).exec();
      if (sameEmailUser) {
        throw new BadRequestException(`User with email ${createUserDto.email} already exists`);
      }

      await this.model.create(createUserDto);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getUserRoles(id: string): Promise<Role[]> {
    try {
      const user: UserDocument = await this.model.findById(id).exec();
      return user.roles;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getUsersTotal(): Promise<number> {
    try {
      return await this.model.find().count().exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
