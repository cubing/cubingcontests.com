import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { find as findTimezone } from "geo-tz";
import { AppService } from "./app.service";
import { MyLogger } from "@m/my-logger/my-logger.service";
import { AuthService } from "@m/auth/auth.service";
import { getScorecards } from "~/src/scorecards/index.js";
import { AuthenticatedGuard } from "~/src/guards/authenticated.guard";
import { AuthTokenGuard } from "~/src/guards/auth-token.guard";
import { RolesGuard } from "~/src/guards/roles.guard";
import { Roles } from "~/src/helpers/roles.decorator";
import { Role } from "@sh/enums";
import { orgPopulateOptions } from "~/src/helpers/dbHelpers";
import { getWcifCompetition } from "@sh/sharedFunctions";
import { ContestDocument } from "~/src/models/contest.model";
import { EnterAttemptDto } from "~/src/app-dto/enter-attempt.dto";
import { LogType } from "~/src/helpers/enums";
import { EmailService } from "@m/email/email.service";
import { ContestsService } from "@m/contests/contests.service";
import { EnterResultsDto } from "./app-dto/enter-results.dto";

@Controller()
export class AppController {
  constructor(
    private readonly logger: MyLogger,
    private readonly service: AppService,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly contestsService: ContestsService,
    @InjectModel("Competition") private readonly contestModel: Model<ContestDocument>,
  ) {}

  @Get("admin-stats")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async getAdminStats() {
    return await this.service.getAdminStats();
  }

  // GET /timezone?latitude=...&longitude=...
  @Get("timezone")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async getTimezone(@Query("latitude") latitude: number, @Query("longitude") longitude: number) {
    this.logger.log(`Getting time zone for coordinates ${latitude}, ${longitude}`);

    if (latitude > 90 || latitude < -90) throw new BadRequestException(`Invalid latitude: ${latitude}`);
    if (longitude > 180 || longitude < -180) throw new BadRequestException(`Invalid longitude: ${longitude}`);

    return { timezone: findTimezone(latitude, longitude)[0] };
  }

  @Get("scorecards/:competitionId")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async getContestScorecards(@Param("competitionId") competitionId: string, @Request() req: any, @Res() res: any) {
    const contest = await this.contestsService.getFullContest(competitionId);

    await this.authService.checkAccessRightsToContest(req.user, contest);

    const buffer = await getScorecards(getWcifCompetition(contest));

    res.set({
      "Content-Type": "application/pdf",
      // For now the file name is set on the frontend
      // 'Content-Disposition': `attachment; filename=${competitionId}_Scorecards.pdf`,
      "Content-Length": buffer.length,
    });

    res.end(buffer);
  }

  @Get("create-auth-token/:competitionId")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async createAuthToken(@Param("competitionId") competitionId: string, @Request() req: any) {
    const contest = await this.contestModel.findOne({ competitionId }).populate(orgPopulateOptions).exec();
    if (!contest) throw new BadRequestException(`Contest with ID ${competitionId} not found`);

    this.authService.checkAccessRightsToContest(req.user, contest);

    return await this.authService.createAuthToken(contest);
  }

  @Post("enter-attempt")
  @UseGuards(AuthTokenGuard)
  async enterAttemptFromExternalDevice(@Body(new ValidationPipe()) enterAttemptDto: EnterAttemptDto) {
    this.logger.logAndSave(
      `Entering attempt from external device: ${JSON.stringify(enterAttemptDto)}`,
      LogType.EnterAttemptFromExtDevice,
    );

    return await this.service.enterAttemptFromExternalDevice(enterAttemptDto);
  }

  @Post("enter-results")
  @UseGuards(AuthTokenGuard)
  async enterResultsFromExternalDevice(@Body(new ValidationPipe()) enterResultsDto: EnterResultsDto) {
    this.logger.logAndSave(
      `Entering multiple results from external device: ${JSON.stringify(enterResultsDto)}`,
      LogType.EnterResultsFromExtDevice,
    );

    return await this.service.enterResultsFromExternalDevice(enterResultsDto);
  }

  @Post("debug-sending-email")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async debugSendingEmail(@Body() { email }: { email: string }) {
    this.logger.logAndSave(`Sending debug email to ${email}`, LogType.DebugEmail);

    await this.emailService.sendEmail(email, "This is a debug email.", { subject: "DEBUG" });
  }
}
