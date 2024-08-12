import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { addWeeks } from 'date-fns';
import { IJwtPayload } from '~/src/helpers/interfaces/JwtPayload';
import { JwtService } from '@nestjs/jwt';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { UsersService } from '@m/users/users.service';
import { CreateUserDto } from '@m/users/dto/create-user.dto';
import { ContestState, Role } from '@sh/enums';
import C from '@sh/constants';
import { IPartialUser } from '~/src/helpers/interfaces/User';
import { ContestDocument } from '~/src/models/contest.model';
import { AuthTokenDocument } from '~/src/models/auth-token.model';
import { NO_ACCESS_RIGHTS_MSG } from '~/src/helpers/messages';
import { getUserEmailVerified } from '~/src/helpers/utilityFunctions';

@Injectable()
export class AuthService {
  constructor(
    private readonly logger: MyLogger,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    @InjectModel('AuthToken') private readonly authTokenModel: Model<AuthTokenDocument>,
  ) {}

  async register(createUserDto: CreateUserDto) {
    createUserDto.email = createUserDto.email.toLowerCase();
    createUserDto.password = await bcrypt.hash(createUserDto.password, C.passwordSaltRounds);

    // Give the user the user role by default
    await this.usersService.createUser({ ...createUserDto, roles: [Role.User] });
  }

  // The user comes from the passport local auth guard (local strategy), which uses the validateUser
  // method below; the user is then saved in the request and passed in from the controller
  async login(user: IPartialUser) {
    // Close the password reset session, cause it's no longer needed if the user was able to log in anyway
    await this.usersService.closePasswordResetSession({ id: user._id.toString() });

    const payload: IJwtPayload = {
      sub: user._id as any,
      personId: user.personId,
      username: user.username,
      roles: user.roles,
    };

    try {
      return { accessToken: this.jwtService.sign(payload) };
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async validateUser(username: string, password: string): Promise<IPartialUser> {
    const email = username.includes('@') ? username.toLowerCase() : undefined;
    const user = await this.usersService.getUserWithQuery(email ? { email } : { username });

    if (user) {
      const passwordsMatch = await bcrypt.compare(password, user.password);

      if (passwordsMatch) {
        if (!getUserEmailVerified(user)) throw new BadRequestException('UNCONFIRMED');

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
    const user: IPartialUser = await this.usersService.getPartialUserWithQuery({ _id: jwtUser._id });

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

  // Assumes the user's access rights have already been checked
  async createAuthToken(competitionId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(token, 0); // there's no need to salt the tokens

    try {
      // Delete existing valid auth token
      await this.authTokenModel.deleteOne({ competitionId, createdAt: { $gt: addWeeks(new Date(), -1) } }).exec();
      await this.authTokenModel.create({ token: hash, competitionId });
    } catch (err) {
      throw new InternalServerErrorException(`Error while saving token: ${err.message}`);
    }

    return token;
  }

  async validateAuthToken(token: string, competitionId: string): Promise<boolean> {
    let authToken: AuthTokenDocument;

    try {
      authToken = await this.authTokenModel
        .findOne({ competitionId, createdAt: { $gt: addWeeks(new Date(), -1) } })
        .exec();
    } catch (err) {
      throw new InternalServerErrorException(`Error while validating token: ${err.message}`);
    }

    return authToken && (await bcrypt.compare(token, authToken.token));
  }

  checkAccessRightsToContest(
    user: IPartialUser,
    contest: ContestDocument, // this must be populated
    { ignoreState = false }: { ignoreState: boolean } = { ignoreState: false },
  ) {
    const hasAccessRights =
      user.roles.includes(Role.Admin) ||
      (user.roles.includes(Role.Moderator) &&
        contest.organizers.some((el) => el.personId === user.personId) &&
        (contest.state < ContestState.Finished || ignoreState));

    if (!hasAccessRights) {
      this.logger.log(`User ${user.username} denied access rights to contest ${contest.competitionId}`);
      throw new UnauthorizedException(NO_ACCESS_RIGHTS_MSG);
    }
  }
}
