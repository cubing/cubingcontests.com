import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { MyLogger } from "@m/my-logger/my-logger.service";
import { LogType } from "~/src/helpers/enums";
import { ContestDto } from "./dto/contest.dto";
import { ContestsService } from "./contests.service";
import { AuthenticatedGuard } from "~/src/guards/authenticated.guard";
import { Roles } from "~/src/helpers/roles.decorator";
import { ContestState, Role } from "@sh/enums";
import { RolesGuard } from "~/src/guards/roles.guard";

@Controller("competitions")
export class ContestsController {
  constructor(private readonly logger: MyLogger, private readonly service: ContestsService) {}

  // GET /competitions?region=...&eventId=...
  @Get()
  async getContests(@Query("region") region?: string, @Query("eventId") eventId?: string) {
    this.logger.logAndSave("Getting contests", LogType.GetContests);

    return await this.service.getContests(region, eventId);
  }

  // GET /competitions/mod
  @Get("mod")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async getModContests(@Request() req: any) {
    this.logger.logAndSave("Getting mod contests", LogType.GetModContests);

    return await this.service.getModContests(req.user);
  }

  // GET /competitions/:competitionId(?eventId=...)
  @Get(":competitionId")
  async getContest(@Param("competitionId") competitionId: string, @Query("eventId") eventId: string) {
    this.logger.logAndSave(`Getting contest with ID ${competitionId}`, LogType.GetContest);

    return await this.service.getContest(competitionId, { eventId });
  }

  // GET /competitions/mod/:competitionId(?eventId=...)
  @Get("mod/:competitionId")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async getModContest(
    @Param("competitionId") competitionId: string,
    @Query("eventId") eventId: string,
    @Request() req: any,
  ) {
    this.logger.logAndSave(`Getting contest with ID ${competitionId} with moderator info`, LogType.GetModContest);

    return await this.service.getContest(competitionId, { eventId, user: req.user });
  }

  // POST /competitions(?saveResults=true)
  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async createContest(
    @Request() req: any, // this is passed in by the guards
    @Body(new ValidationPipe()) contestDto: ContestDto,
    @Query("saveResults") saveResults = false,
  ) {
    this.logger.logAndSave(`Creating contest ${contestDto.competitionId}`, LogType.CreateContest);

    // Only admins are allowed to import contests and have the results immediately saved
    return await this.service.createContest(contestDto, req.user, saveResults && req.user.roles.includes(Role.Admin));
  }

  // POST /competitions/:competitionId/open-round/:roundId
  @Post(':competitionId/open-round/:roundId')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async openRound(@Param('competitionId') competitionId: string, @Param('roundId') roundId: string) {
    this.logger.logAndSave(`Opening round ${roundId} for contest ${competitionId}`, LogType.OpenRound);

    return await this.service.openRound(competitionId, roundId);
  }

  // PATCH /competitions/:competitionId
  @Patch(":competitionId")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async updateContest(
    @Param("competitionId") competitionId: string,
    @Body(new ValidationPipe()) contestDto: ContestDto,
    @Request() req: any, // this is passed in by the guards
  ) {
    this.logger.logAndSave(`Updating contest ${competitionId}`, LogType.UpdateContest);

    return await this.service.updateContest(competitionId, contestDto, req.user);
  }

  // PATCH /competitions/set-state/:competitionId
  @Patch("set-state/:competitionId")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async updateState(
    @Param("competitionId") competitionId: string,
    @Body() { newState }: { newState: string },
    @Request() req: any,
  ) {
    const parsedState = parseInt(newState);
    if (isNaN(parsedState) || !Object.values(ContestState).includes(parsedState)) {
      throw new BadRequestException("Please provide a valid state");
    }
    if (parsedState === ContestState.Removed) {
      throw new BadRequestException(
        "You may not directly set the state to removed. Use the remove contest feature instead.",
      );
    }

    this.logger.logAndSave(`Setting state ${newState} for contest ${competitionId}`, LogType.UpdateContestState);

    return await this.service.updateState(competitionId, parseInt(newState) as ContestState, req.user);
  }

  // DELETE /competitions/:competitionId
  @Delete(":competitionId")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async deleteContest(@Param("competitionId") competitionId: string, @Request() req: any) {
    this.logger.logAndSave(`Removing contest ${competitionId}`, LogType.RemoveContest);

    return await this.service.deleteContest(competitionId, req.user);
  }

  // PATCH /competitions/enable-queue/:competitionId
  @Patch("enable-queue/:competitionId")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async enableQueue(@Param("competitionId") competitionId: string, @Request() req: any) {
    return await this.service.enableQueue(competitionId, req.user);
  }

  // PATCH /competitions/queue-increment/:competitionId
  @Patch("queue-increment/:competitionId")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async incrementQueuePosition(@Param("competitionId") competitionId: string, @Request() req: any) {
    return await this.service.changeQueuePosition(competitionId, req.user, { difference: 1 });
  }

  // PATCH /competitions/queue-decrement/:competitionId
  @Patch("queue-decrement/:competitionId")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async decrementQueuePosition(@Param("competitionId") competitionId: string, @Request() req: any) {
    return await this.service.changeQueuePosition(competitionId, req.user, { difference: -1 });
  }

  // PATCH /competitions/queue-reset/:competitionId
  @Patch("queue-reset/:competitionId")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async resetQueue(@Param("competitionId") competitionId: string, @Request() req: any) {
    return await this.service.changeQueuePosition(competitionId, req.user, { newPosition: 1 });
  }
}
