import { setTimeout as nodeSetTimeout } from 'timers/promises';
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
import { randomBytes } from 'crypto';
import { addDays } from 'date-fns';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { UserDocument } from '~/src/models/user.model';
import { PersonsService } from '@m/persons/persons.service';
import { EmailService } from '@m/email/email.service';
import { Role } from '@sh/enums';
import { IFrontendUser } from '@sh/interfaces';
import C from '@sh/constants';
import { getFormattedTime } from '@sh/sharedFunctions';
import { IPartialUser, IUser } from '~/src/helpers/interfaces/User';
import { UpdateUserDto } from './dto/update-user.dto';
import { LogType } from '~/src/helpers/enums';
import { ALREADY_VERIFIED_MSG, USER_NOT_FOUND_MSG } from '~/src/helpers/messages';
import { getUserEmailVerified } from '~/src/helpers/utilityFunctions';

const verificationCodeSaltRounds = 10; // useful, because it's short, so a rainbow table could theoretically match it

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
    return await this.userModel
      .findOne(query, {
        password: 0,
        email: 0,
        confirmationCodeHash: 0,
        confirmationCodeAttempts: 0,
        cooldownStarted: 0,
      })
      .exec();
  }

  async getUserEmail(query: { username?: string; _id?: unknown }): Promise<string> {
    const user = await this.userModel.findOne(query, { email: 1 }).exec();
    return user?.email;
  }

  async getUsers(): Promise<IFrontendUser[]> {
    // Make sure this query matches the logic in getUserEmailVerified
    const users = await this.userModel
      .find({ confirmationCodeHash: { $exists: false }, cooldownStarted: { $exists: false } })
      .exec();
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
    newUser.confirmationCodeHash = await bcrypt.hash(code, verificationCodeSaltRounds);
    newUser.confirmationCodeAttempts = 0;

    await this.userModel.create(newUser);

    await this.emailService.sendEmailConfirmationCode(newUser.email, code);
  }

  async verifyEmail(username: string, code: string) {
    const user = await this.userModel.findOne({ username }).exec();

    if (user) {
      if (getUserEmailVerified(user)) throw new BadRequestException(ALREADY_VERIFIED_MSG);
      // It's possible that the user is in cooldown from resending the confirmation code, but still has attempts left
      if (user.confirmationCodeAttempts >= C.maxConfirmationCodeAttempts) {
        this.checkUserCooldown(user);

        if (!user.confirmationCodeHash)
          throw new BadRequestException('Please resend the confirmation code before trying again');
      }

      // Using .toLowerCase(), because the code doesn't need to be case-sensitive
      const codeMatches = await bcrypt.compare(code.toLowerCase(), user.confirmationCodeHash);

      if (codeMatches) {
        user.confirmationCodeHash = undefined;
        user.confirmationCodeAttempts = undefined;
        user.cooldownStarted = undefined;
        await user.save();

        return;
      }

      user.confirmationCodeAttempts++;

      if (user.confirmationCodeAttempts < C.maxConfirmationCodeAttempts) {
        user.cooldownStarted = undefined;
        await user.save();

        const remainingAttempts = C.maxConfirmationCodeAttempts - user.confirmationCodeAttempts;
        throw new BadRequestException(
          `The entered code is incorrect. Please try again (${remainingAttempts} attempt${
            remainingAttempts > 1 ? 's' : ''
          } left).`,
        );
      } else {
        user.confirmationCodeHash = undefined;
        user.cooldownStarted = new Date();
        await user.save();

        throw new BadRequestException(
          `The entered code is incorrect and you have no more attempts left. Please request a new code after the ${Math.round(
            C.confirmationCodeCooldown / 60000,
          )} minute cooldown is over.`,
        );
      }
    }

    throw new NotFoundException(USER_NOT_FOUND_MSG);
  }

  async resendConfirmationCode(username: string) {
    const user = await this.userModel.findOne({ username }).exec();

    if (user) {
      if (getUserEmailVerified(user)) throw new BadRequestException(ALREADY_VERIFIED_MSG);
      this.checkUserCooldown(user);

      const code = this.generateVerificationCode();
      user.confirmationCodeHash = await bcrypt.hash(code, verificationCodeSaltRounds);
      user.confirmationCodeAttempts = 0;
      user.cooldownStarted = new Date();
      await user.save();

      await this.emailService.sendEmailConfirmationCode(user.email, code);
      return;
    }

    throw new NotFoundException(USER_NOT_FOUND_MSG);
  }

  async requestPasswordReset(email: string) {
    const user = await this.userModel.findOne({ email }).exec();

    if (user) {
      const code = randomBytes(32).toString('hex');
      user.passwordResetCodeHash = await bcrypt.hash(code, 0);
      user.passwordResetStarted = new Date();
      await user.save();

      await this.emailService.sendPasswordResetCode(user.email, code);
    } else {
      this.logger.log(`User with email ${email} not found when requesting password reset`);

      // Wait random amount of time from 1500 to 2500 ms to make it harder to detect if the email was found or not
      const randomTimeout = 1500 + Math.round(Math.random() * 1000);
      await nodeSetTimeout(randomTimeout);
      return;
    }
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.userModel.findOne({ email, passwordResetCodeHash: { $exists: true } }).exec();

    if (user) {
      const sessionExpired = addDays(user.passwordResetStarted, C.passwordResetSessionLength).getTime() < Date.now();

      if (sessionExpired) {
        await this.closePasswordResetSession({ user });

        throw new BadRequestException(
          'The password reset session has expired. Please make a new password reset request on the login page.',
        );
      }

      const codeMatches = await bcrypt.compare(code, user.passwordResetCodeHash);

      if (codeMatches) {
        user.password = await bcrypt.hash(newPassword, C.passwordSaltRounds);
        await this.closePasswordResetSession({ user });

        await this.emailService.sendPasswordChangedNotification(email);
        return;
      }
    }

    throw new BadRequestException('Password reset failed. Please try again.');
  }

  async closePasswordResetSession({ user, id }: { user?: UserDocument; id?: string }) {
    if (!user) user = await this.userModel.findById(id).exec();
    if (!user) throw new InternalServerErrorException('User not found');

    user.passwordResetCodeHash = undefined;
    user.passwordResetStarted = undefined;
    await user.save();
  }

  async updateUser(updateUserDto: UpdateUserDto): Promise<IFrontendUser[]> {
    this.logger.logAndSave(`Updating user with username ${updateUserDto.username}`, LogType.UpdateUser);

    const user = await this.userModel.findOne({ username: updateUserDto.username }).exec();

    if (!user) throw new NotFoundException(`User with username ${updateUserDto.username} not found`);
    if (updateUserDto.email !== user.email) throw new BadRequestException('Changing the email is not allowed');
    await this.validateUserObject(updateUserDto);

    let newRole: Role;
    if (!user.roles.includes(Role.Admin) && updateUserDto.roles.includes(Role.Admin)) newRole = Role.Admin;
    else if (!user.roles.includes(Role.Moderator) && updateUserDto.roles.includes(Role.Moderator))
      newRole = Role.Moderator;

    user.roles = updateUserDto.roles;
    if (updateUserDto.person) user.personId = updateUserDto.person.personId;
    else user.personId = undefined;

    await user.save();

    if (newRole) await this.emailService.sendPrivilegesGrantedNotification(user.email, newRole);

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

  // Generates an 8 character alphanumeric code
  private generateVerificationCode(): string {
    return randomBytes(4).toString('hex');
  }

  private checkUserCooldown(user: UserDocument) {
    if (user.cooldownStarted) {
      const remainingCooldownTime = C.confirmationCodeCooldown - (Date.now() - user.cooldownStarted.getTime());

      if (remainingCooldownTime > 0) {
        throw new BadRequestException(
          `You have an active cooldown, please try again later. Remaining time: ${getFormattedTime(
            Math.round(remainingCooldownTime / 10),
          )}`,
        );
      }
    }
  }
}
