import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { UserDocument } from '~/src/models/user.model';
import { PersonsService } from '@m/persons/persons.service';
import { EmailService } from '@m/email/email.service';
import { Role } from '@sh/enums';
import { IFrontendUser } from '@sh/interfaces';
import { IPartialUser, IUser } from '~/src/helpers/interfaces/User';
import { UpdateUserDto } from './dto/update-user.dto';
import { LogType } from '~/src/helpers/enums';
import { ALREADY_VERIFIED_MSG, USER_NOT_FOUND_MSG } from '~/src/helpers/messages';

@Injectable()
export class UsersService {
  constructor(
    private readonly logger: MyLogger,
    private readonly personsService: PersonsService,
    private readonly emailService: EmailService,
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
  ) {}

  // WARNING: this method returns the hashed password too. It is ONLY to be used in the auth module.
  async getUserWithQuery(query: any): Promise<IUser> {
    return await this.userModel.findOne(query).exec();
  }

  async getPartialUserWithQuery(query: any): Promise<IPartialUser> {
    return await this.userModel.findOne(query, { password: 0, email: 0, confirmationCodeHash: 0 }).exec();
  }

  async getUsers(): Promise<IFrontendUser[]> {
    const users = await this.userModel.find({ confirmationCodeHash: { $exists: false } }).exec();
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
    if (sameUsernameUser) throw new BadRequestException(`User with username ${newUser.username} already exists`);

    await this.validateUserObject(newUser);

    const code = this.generateVerificationCode();
    newUser.confirmationCodeHash = await bcrypt.hash(code, 10);

    await this.userModel.create(newUser);

    await this.emailService.sendEmailConfirmationCode(newUser.email, code);
  }

  async verifyEmail(username: string, code: string) {
    const user = await this.userModel.findOne({ username }).exec();

    if (user) {
      if (!user.confirmationCodeHash) throw new BadRequestException(ALREADY_VERIFIED_MSG);

      // Using .toLowerCase(), because the code doesn't need to be case-sensitive
      const codeMatches = await bcrypt.compare(code.toLowerCase(), user.confirmationCodeHash);

      if (codeMatches) {
        user.confirmationCodeHash = undefined;

        await user.save();

        return;
      }

      throw new BadRequestException('The entered code is incorrect. Please try again.');
    }

    throw new NotFoundException(USER_NOT_FOUND_MSG);
  }

  async resendConfirmationCode(username: string) {
    const user = await this.userModel.findOne({ username }).exec();

    if (user) {
      if (!user.confirmationCodeHash) throw new BadRequestException(ALREADY_VERIFIED_MSG);

      const code = this.generateVerificationCode();
      user.confirmationCodeHash = await bcrypt.hash(code, 10);

      await user.save();

      await this.emailService.sendEmailConfirmationCode(user.email, code);
      return;
    }

    throw new NotFoundException(USER_NOT_FOUND_MSG);
  }

  async updateUser(updateUserDto: UpdateUserDto): Promise<IFrontendUser[]> {
    this.logger.logAndSave(`Updating user with username ${updateUserDto.username}`, LogType.UpdateUser);

    const user = await this.userModel.findOne({ username: updateUserDto.username }).exec();

    if (!user) throw new NotFoundException(`User with username ${updateUserDto.username} not found`);
    if (updateUserDto.email !== user.email) throw new BadRequestException('Changing the email is not allowed');
    await this.validateUserObject(updateUserDto);

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
    const user = await this.userModel.findById(id).exec();

    return user?.roles;
  }

  async getUsername(id: string): Promise<string> {
    const user = await this.userModel.findById(id).exec();

    return user?.username;
  }

  async getUsersTotal({ unconfirmedOnly }: { unconfirmedOnly: boolean } = { unconfirmedOnly: false }): Promise<number> {
    return await this.userModel
      .countDocuments(unconfirmedOnly ? { confirmationCodeHash: { $exists: true } } : undefined)
      .exec();
  }

  private async validateUserObject(user: IUser | IFrontendUser) {
    const sameEmailUser: UserDocument = await this.userModel
      .findOne({ username: { $ne: user.username }, email: user.email })
      .exec();

    if (sameEmailUser) {
      throw new BadRequestException(`User with email ${user.email} already exists`);
    }

    const personId = (user as any).personId ?? (user as any).person?.personId;

    if (personId) {
      const samePersonUser = await this.userModel.findOne({ username: { $ne: user.username }, personId }).exec();

      if (samePersonUser) {
        throw new ConflictException('The selected competitor is already tied to another user');
      }
    }
  }

  private generateVerificationCode(): string {
    return uuidv4().replaceAll('-', '').slice(0, 8); // generates an 8 character alphanumeric code
  }
}
