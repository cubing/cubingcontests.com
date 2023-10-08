import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { ResultsService } from './results.service';
import { EventsService } from '@m/events/events.service';
import { CreateResultDto } from './dto/create-result.dto';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '@sh/enums';

@Controller('results')
export class ResultsController {
  constructor(private readonly service: ResultsService, private readonly eventsService: EventsService) {}

  // GET /results/rankings/:eventId/:singleOrAvg(?show=results)
  @Get('rankings/:eventId/:singleOrAvg')
  async getRankings(
    @Param('eventId') eventId: string,
    @Param('singleOrAvg') singleOrAvg: 'single' | 'average',
    @Query('show') show?: 'results',
  ) {
    console.log(`Getting ${singleOrAvg} rankings for ${eventId}`);
    return await this.service.getRankings(eventId, singleOrAvg === 'average', show);
  }

  // GET /results/records/:wcaEquivalent
  @Get('records/:wcaEquivalent')
  async getRecords(@Param('wcaEquivalent') wcaEquivalent: string) {
    console.log(`Getting ${wcaEquivalent} records`);
    return await this.service.getRecords(wcaEquivalent);
  }

  // GET /results/submission-info/:recordsUpTo
  @Get('submission-info/:recordsUpTo')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.User)
  async getSubmissionInfo(@Param('recordsUpTo') recordsUpTo: string) {
    const recordsUpToDate = new Date(recordsUpTo);
    console.log(`Getting results submission info with records up to ${recordsUpToDate.toUTCString()}`);
    return await this.service.getSubmissionInfo(recordsUpToDate);
  }

  // GET /results/record-pairs/:eventId/:recordsUpTo
  @Get('record-pairs/:eventId/:recordsUpTo')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async getRecordPairs(@Param('eventId') eventId: string, @Param('recordsUpTo') recordsUpTo: string) {
    const recordsUpToDate = new Date(recordsUpTo);
    console.log(`Getting record pair for ${eventId} with records up to ${recordsUpToDate.toUTCString()}`);

    const event = await this.eventsService.getEventById(eventId);
    return await this.service.getEventRecordPairs(event, recordsUpToDate);
  }

  // POST /results/:roundId
  @Post(':roundId')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async createResult(
    @Param('roundId') roundId: string,
    @Body(new ValidationPipe()) createResultDto: CreateResultDto,
    @Request() req: any,
  ) {
    console.log(`Creating new result for contest ${createResultDto.competitionId}, round ${roundId}`);
    return await this.service.createResult(createResultDto, roundId, req.user);
  }

  // DELETE /results/:competitionId/:resultId
  @Delete(':competitionId/:resultId')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async deleteContestResult(
    @Param('competitionId') competitionId: string,
    @Param('resultId') resultId: string,
    @Request() req: any,
  ) {
    console.log(`Deleting result with id ${resultId} from contest ${competitionId}`);
    return await this.service.deleteContestResult(resultId, competitionId, req.user);
  }

  // POST /results
  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.User)
  async submitResult(@Body(new ValidationPipe()) createResultDto: CreateResultDto, @Request() req: any) {
    console.log(`Submitting new result for event ${createResultDto.eventId}`);
    return await this.service.submitResult(createResultDto, req.user);
  }
}
