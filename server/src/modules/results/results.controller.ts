import {
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
import { ResultsService } from "./results.service";
import { EventsService } from "@m/events/events.service";
import { CreateResultDto } from "./dto/create-result.dto";
import { AuthenticatedGuard } from "~/src/guards/authenticated.guard";
import { RolesGuard } from "~/src/guards/roles.guard";
import { Roles } from "~/src/helpers/roles.decorator";
import { Role } from "~/helpers/enums";
import { CreateVideoBasedResultDto } from "./dto/create-video-based-result.dto";
import { UpdateResultDto } from "./dto/update-result.dto";
import { LogType } from "~/src/helpers/enums";
import { getDateOnly } from "~/helpers/sharedFunctions";
import { UpdateVideoBasedResultDto } from "~/src/modules/results/dto/update-video-based-result.dto";

@Controller("results")
export class ResultsController {
  constructor(
    private readonly logger: MyLogger,
    private readonly service: ResultsService,
    private readonly eventsService: EventsService,
  ) {}

  // GET /results/rankings/:eventId/:singleOrAvg
  @Get("rankings/:eventId/:singleOrAvg")
  async getRankings(
    @Param("eventId") eventId: string,
    @Param("singleOrAvg") singleOrAvg: "single" | "average",
    @Query("show") show?: "results",
    @Query("region") region?: string,
    @Query("topN") topN?: string,
  ) {
    this.logger.logAndSave(
      `Getting ${singleOrAvg} rankings for ${eventId}`,
      LogType.GetRankings,
    );

    return await this.service.getRankings(
      eventId,
      singleOrAvg === "average",
      show,
      region,
      topN ? Number(topN) : undefined,
    );
  }

  // GET /results/records/:wcaEquivalent
  @Get("records/:wcaEquivalent")
  async getRecords(@Param("wcaEquivalent") wcaEquivalent: string) {
    this.logger.logAndSave(
      `Getting ${wcaEquivalent} records`,
      LogType.GetRecords,
    );

    return await this.service.getRecords(wcaEquivalent);
  }

  // GET /results/submission-info/:recordsUpTo(?resultId=...)
  @Get("submission-info/:recordsUpTo")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.User)
  async getSubmissionInfo(@Param("recordsUpTo") recordsUpTo: string) {
    const recordsUpToDate = getDateOnly(new Date(recordsUpTo));
    this.logger.log(
      `Getting results submission info with records up to ${recordsUpToDate.toUTCString()}`,
    );

    return await this.service.getSubmissionInfo(recordsUpToDate);
  }

  // GET /results/editing-info/:resultId
  @Get("editing-info/:resultId")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async getEditingInfo(@Param("resultId") resultId: string) {
    this.logger.log(
      `Getting results editing info for result with ID ${resultId}`,
    );

    return await this.service.getEditingInfo(resultId);
  }

  // GET /results/record-pairs/:recordsUpTo/:eventIds(?excludeResultId=...)
  @Get("record-pairs/:recordsUpTo/:eventIds")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.User)
  async getRecordPairs(
    @Param("recordsUpTo") recordsUpTo: string,
    @Param("eventIds") eventIds: string,
    @Query("excludeResultId") excludeResultId: string,
  ) {
    const recordsUpToDate = getDateOnly(new Date(recordsUpTo));
    this.logger.log(
      `Getting record pair with records up to ${recordsUpToDate.toUTCString()}`,
    );

    const events = await this.eventsService.getEvents({
      eventIds: eventIds.split(","),
    });
    return await this.service.getRecordPairs(events, recordsUpToDate, {
      excludeResultId,
    });
  }

  // GET /results/video-based
  @Get("video-based")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async getVideoBasedResults() {
    return await this.service.getVideoBasedResults();
  }

  // POST /results/:roundId
  @Post(":competitionId/:roundId")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async createResult(
    @Param("competitionId") competitionId: string,
    @Param("roundId") roundId: string,
    @Body(new ValidationPipe()) createResultDto: CreateResultDto,
    @Request() req: any,
  ) {
    return await this.service.createResult(
      competitionId,
      roundId,
      createResultDto,
      req.user,
    );
  }

  // PATCH /results/:id
  @Patch(":id")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async updateResult(
    @Param("id") id: string,
    @Body(new ValidationPipe()) updateResultDto: UpdateResultDto,
    @Request() req: any,
  ) {
    return await this.service.updateResult(id, updateResultDto, {
      user: req.user,
    });
  }

  // POST /results
  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.User)
  async createVideoBasedResult(
    @Body(new ValidationPipe()) createResultDto: CreateVideoBasedResultDto,
    @Request() req: any,
  ) {
    return await this.service.createVideoBasedResult(createResultDto, req.user);
  }

  // PATCH /results/video-based/:id
  @Patch("video-based/:id")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async updateVideoBasedResult(
    @Param("id") id: string,
    @Body(new ValidationPipe()) updateResultDto: UpdateVideoBasedResultDto,
  ) {
    return await this.service.updateVideoBasedResult(id, updateResultDto);
  }

  // DELETE /results/:id
  @Delete(":id")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async deleteContestResult(@Param("id") id: string, @Request() req: any) {
    return await this.service.deleteResult(id, req.user);
  }
}
