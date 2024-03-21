import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { UserDocument } from '~/src/models/user.model';
import { PersonsService } from '@m/persons/persons.service';
import { Role } from '@sh/enums';
import { IFrontendUser } from '@sh/interfaces';
import { IUser } from '~/src/helpers/interfaces/User';
import { UpdateUserDto } from './dto/update-user.dto';
import { LogType } from '~/src/helpers/enums';

@Injectable()
export class UsersService {
  constructor(
    private readonly logger: MyLogger,
    private readonly personsService: PersonsService,
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
  ) {}

  // WARNING: this method returns the hashed password too. It is ONLY to be used in the auth module.
  async getUserWithQuery(
    query: { _id?: string; username?: string; personId?: number },
    { includeHash }: { includeHash?: boolean } = {},
  ): Promise<UserDocument> {
    try {
      const user = await this.userModel.findOne(query, includeHash ? {} : { password: 0 }).exec();

      return user || undefined;
    } catch (err) {
      throw new InternalServerErrorException(`Error while reading user data: ${err.message}`);
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

  // WARNING: this expects that the password is ALREADY encrypted! That is done in the auth module.
  async createUser(newUser: IUser) {
    this.logger.logAndSave(`Creating new user with username ${newUser.username}`, LogType.CreateUser);

    const sameUsernameUser: UserDocument = await this.userModel.findOne({ username: newUser.username }).exec();
    if (sameUsernameUser) {
      throw new BadRequestException(`User with username ${newUser.username} already exists`);
    }

    await this.validateUser(newUser);

    await this.userModel.create(newUser);
  }

  async updateUser(updateUserDto: UpdateUserDto): Promise<IFrontendUser[]> {
    this.logger.logAndSave(`Updating user with username ${updateUserDto.username}`, LogType.UpdateUser);

    const user = await this.userModel.findOne({ username: updateUserDto.username }).exec();

    if (!user) throw new NotFoundException(`User with username ${updateUserDto.username} not found`);
    if (updateUserDto.email !== user.email) throw new BadRequestException('Changing the email is not allowed');
    await this.validateUser(updateUserDto);

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

  async getUsername(id: string): Promise<string> {
    try {
      const user: UserDocument = await this.userModel.findById(id).exec();
      return user?.username;
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

  private async validateUser(user: IUser | IFrontendUser) {
    const sameEmailUser: UserDocument = await this.userModel
      .findOne({ username: { $ne: user.username }, email: user.email })
      .exec();

    if (sameEmailUser) {
      throw new BadRequestException(`User with email ${user.email} already exists`);
    }

    const personId = (user as any).personId ?? (user as any).person?.personId;
    const samePersonUser = await this.userModel.findOne({ username: { $ne: user.username }, personId }).exec();

    if (samePersonUser) {
      throw new ConflictException('The selected competitor is already tied to another user');
    }
  }
}
