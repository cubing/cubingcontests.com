import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, RootFilterQuery } from "mongoose";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { addWeeks } from "date-fns";
import { IJwtPayload } from "~/src/helpers/interfaces/JwtPayload";
import { JwtService } from "@nestjs/jwt";
import { MyLogger } from "@m/my-logger/my-logger.service";
import { UsersService } from "@m/users/users.service";
import { CreateUserDto } from "@m/users/dto/create-user.dto";
import { ContestState, Role } from "@sh/enums";
import C from "@sh/constants";
import { IPartialUser } from "~/src/helpers/interfaces/User";
import { ContestDocument } from "~/src/models/contest.model";
import { AuthTokenDocument } from "~/src/models/auth-token.model";
import { getUserEmailVerified } from "~/src/helpers/utilityFunctions";
import { LogType } from "~/src/helpers/enums";

@Injectable()
export class AuthService {
  constructor(
    private readonly logger: MyLogger,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    @InjectModel("AuthToken") private readonly authTokenModel: Model<AuthTokenDocument>,
  ) {}

  async register(createUserDto: CreateUserDto) {
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
      email: user.email,
      roles: user.roles,
    };

    try {
      return { accessToken: this.jwtService.sign(payload) };
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async validateUser(username: string, password: string): Promise<IPartialUser> {
    const query = username.includes('@') ? { email: username.trim().toLowerCase() } : { username }
    const user = await this.usersService.getUserWithQuery(query);

    if (user) {
      const passwordsMatch = await bcrypt.compare(password, user.password);

      if (passwordsMatch) {
        if (!getUserEmailVerified(user)) throw new BadRequestException("UNCONFIRMED");

        return {
          _id: user._id,
          personId: user.personId,
          username: user.username,
          email: user.email,
          roles: user.roles,
        };
      }
    }

    throw new NotFoundException("The username or password is incorrect");
  }

  async revalidate(jwtUser: any) {
    const user: IPartialUser = await this.usersService.getPartialUserWithQuery({ _id: jwtUser._id });

    const payload: IJwtPayload = {
      sub: user._id as string,
      personId: user.personId,
      username: user.username,
      email: user.email,
      roles: user.roles,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async getUserRoles(id: string): Promise<Role[]> {
    return await this.usersService.getUserRoles(id);
  }

  // ASSUMES THE USER'S ACCESS RIGHTS HAVE ALREADY BEEN CHECKED!
  async createAuthToken(contest: ContestDocument): Promise<string> {
    if (contest.state < ContestState.Approved) {
      throw new BadRequestException("You may not create an access token for a contest that hasn't been approved yet");
    }
    if (contest.state >= ContestState.Finished) {
      throw new BadRequestException("You may not create an access token for a finished contest");
    }

    const token = randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(token, 0); // there's no need to salt the tokens

    try {
      // Delete existing valid auth token
      await this.authTokenModel
        .deleteOne({
          competitionId: contest.competitionId,
          createdAt: { $gt: addWeeks(new Date(), -1) },
        } as RootFilterQuery<AuthTokenDocument>)
        .exec();
      await this.authTokenModel.create({ token: hash, competitionId: contest.competitionId });
    } catch (err) {
      throw new InternalServerErrorException(`Error while saving token: ${err.message}`);
    }

    return token;
  }

  async validateAuthToken(token: string, competitionId: string): Promise<boolean> {
    let authToken: AuthTokenDocument;

    try {
      authToken = await this.authTokenModel
        .findOne({ competitionId, createdAt: { $gt: addWeeks(new Date(), -1) } } as RootFilterQuery<AuthTokenDocument>)
        .exec();
    } catch (err) {
      throw new InternalServerErrorException(`Error while validating token: ${err.message}`);
    }

    return authToken && (await bcrypt.compare(token, authToken.token));
  }

  async deleteAuthToken(competitionId: string) {
    await this.authTokenModel.deleteMany({ competitionId }).exec();
  }

  // THE CONTEST MUST ALREADY BE POPULATED!
  checkAccessRightsToContest(user: IPartialUser, contest: ContestDocument) {
    if (contest.state === ContestState.Removed) throw new BadRequestException("This contest has been removed");

    const hasAccessRights = user.roles.includes(Role.Admin) ||
      (user.roles.includes(Role.Moderator) &&
        contest.organizers.some((el) => el.personId === user.personId) &&
        contest.state < ContestState.Finished);

    if (!hasAccessRights) {
      this.logger.logAndSave(
        `User ${user.username} denied access rights to contest ${contest.competitionId}`,
        LogType.AccessDenied,
      );

      throw new UnauthorizedException("You do not have access rights for this contest");
    }
  }
}
