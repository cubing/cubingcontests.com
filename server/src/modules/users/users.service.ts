import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from '~/src/models/user.model';
import { PersonsService } from '@m/persons/persons.service';
import { Role } from '@sh/enums';
import { IFrontendUser } from '@sh/interfaces';
import { IPartialUser, IUser } from '~/src/helpers/interfaces/User';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private personsService: PersonsService,
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
  ) {}

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
      throw new InternalServerErrorException(`Error while getting user ${username}: ${err.message}`);
    }
  }

  async getUsers(): Promise<IFrontendUser[]> {
    let users: UserDocument[];

    try {
      users = await this.userModel.find().exec();
    } catch (err) {
      throw new InternalServerErrorException(`Error while getting users: ${err.message}`);
    }

    const usersForFrontend: IFrontendUser[] = [];

    for (const user of users) {
      usersForFrontend.push({
        username: user.username,
        email: user.email,
        person: user.personId ? await this.personsService.getPersonById(user.personId) : undefined,
        roles: user.roles,
      });
    }

    return usersForFrontend;
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

  async updateUser(updateUserDto: UpdateUserDto): Promise<IFrontendUser[]> {
    let user: UserDocument;

    try {
      user = await this.userModel.findOne({ username: updateUserDto.username }).exec();
    } catch (err) {
      throw new InternalServerErrorException(`Error while getting user during update: ${err.message}`);
    }

    if (!user) throw new NotFoundException(`User with username ${updateUserDto.username} not found`);
    if (updateUserDto.email !== user.email) throw new BadRequestException('Changing the email is not allowed');

    user.roles = updateUserDto.roles;
    if (updateUserDto.person) user.personId = updateUserDto.person.personId;
    else user.personId = undefined;

    try {
      await user.save();
    } catch (err) {
      throw new InternalServerErrorException(`Error while saving user: ${err.message}`);
    }

    return await this.getUsers();
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
