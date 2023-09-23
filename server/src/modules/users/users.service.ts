import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from '~/src/models/user.model';
import { Role } from '@sh/enums';
import { IPartialUser, IUser } from '~/src/helpers/interfaces/User';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly userModel: Model<UserDocument>) {}

  // WARNING: this method returns the hashed password too. It is ONLY to be used in the auth module.
  async getUser(username: string) {
    try {
      const user: UserDocument = await this.userModel.findOne({ username }).exec();

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

  async getPartialUserById(id: string): Promise<IPartialUser> {
    try {
      const user: UserDocument = await this.userModel.findOne({ _id: id }).exec();

      if (user) {
        return {
          _id: user._id.toString(),
          personId: user.personId,
          username: user.username,
          roles: user.roles,
        };
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // WARNING: this expects that the password is ALREADY encrypted! That is done in the auth module.
  async createUser(newUser: IUser) {
    try {
      const sameUsernameUser: UserDocument = await this.userModel.findOne({ username: newUser.username }).exec();
      if (sameUsernameUser) {
        throw new BadRequestException(`User with username ${newUser.username} already exists`);
      }

      const sameEmailUser: UserDocument = await this.userModel.findOne({ email: newUser.email }).exec();
      if (sameEmailUser) {
        throw new BadRequestException(`User with email ${newUser.email} already exists`);
      }

      await this.userModel.create(newUser);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getUserRoles(id: string): Promise<Role[]> {
    try {
      const user: UserDocument = await this.userModel.findById(id).exec();
      return user.roles;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getUsersTotal(): Promise<number> {
    try {
      return await this.userModel.countDocuments().exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
