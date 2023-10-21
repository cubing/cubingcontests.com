import { Controller, Get, Post, Patch, Param, Request, Body, Query, ValidationPipe, UseGuards } from '@nestjs/common';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { LogType } from '~/src/helpers/enums';
import { CreateContestDto } from './dto/create-contest.dto';
import { ContestsService } from './contests.service';
import { UpdateContestDto } from './dto/update-contest.dto';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { ContestState, Role } from '@sh/enums';
import { RolesGuard } from '~/src/guards/roles.guard';

@Controller('competitions')
export class ContestsController {
  constructor(private readonly logger: MyLogger, private readonly service: ContestsService) {}

  // GET /competitions?region=...
  @Get()
  async getContests(@Query('region') region: string) {
    this.logger.logAndSave('Getting contests', LogType.GetContests);

    return await this.service.getContests(region);
  }

  // GET /competitions/mod
  @Get('mod')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async getModContests(@Request() req: any) {
    this.logger.logAndSave('Getting contests with moderator info', LogType.GetModContests);

    return await this.service.getModContests(req.user);
  }

  // GET /competitions/:competitionId
  @Get(':competitionId')
  async getContest(@Param('competitionId') competitionId: string) {
    this.logger.logAndSave(`Getting contest with ID ${competitionId}`, LogType.GetContest);

    return await this.service.getContest(competitionId);
  }

  // GET /competitions/mod/:competitionId
  @Get('mod/:competitionId')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async getModCompetition(@Param('competitionId') competitionId: string, @Request() req: any) {
    this.logger.logAndSave(`Getting contest with ID ${competitionId} with moderator info`, LogType.GetModContest);

    return await this.service.getContest(competitionId, req.user);
  }

  // POST /competitions(?saveResults=true)
  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async createContest(
    @Request() req: any, // this is passed in by the guards
    @Body(new ValidationPipe()) createContestDto: CreateContestDto,
    @Query('saveResults') saveResults = false,
  ) {
    this.logger.logAndSave(`Creating contest ${createContestDto.competitionId}`, LogType.CreateContest);

    return await this.service.createContest(
      createContestDto,
      req.user.personId,
      saveResults && req.user.roles.includes(Role.Admin),
    );
  }

  // PATCH /competitions/:competitionId
  @Patch(':competitionId')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async updateContest(
    @Param('competitionId') competitionId: string,
    @Body(new ValidationPipe()) updateContestDto: UpdateContestDto,
    @Request() req: any, // this is passed in by the guards
  ) {
    this.logger.logAndSave(`Updating contest ${competitionId}`, LogType.UpdateContest);

    return await this.service.updateContest(competitionId, updateContestDto, req.user);
  }

  // PATCH /competitions/:competitionId/:newState
  @Patch(':competitionId/:newState')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async updateState(
    @Param('competitionId') competitionId: string,
    @Param('newState') newState: string,
    @Request() req: any, // this is passed in by the guards
  ) {
    this.logger.logAndSave(`Setting state ${newState} for contest ${competitionId}`, LogType.UpdateContestState);

    return await this.service.updateState(competitionId, parseInt(newState) as ContestState, req.user);
  }
}
