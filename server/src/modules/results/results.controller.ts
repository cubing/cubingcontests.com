import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { format } from 'date-fns';
import { ResultsService } from './results.service';
import { Roles } from '~/src/helpers/roles.decorator';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Role } from '@sh/enums';
import { CreateResultDto } from './dto/create-result.dto';

@Controller('results')
export class ResultsController {
  constructor(private readonly service: ResultsService) {}

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
  async getSubmissionInfo(@Param('recordsUpTo') recordsUpTo: string | Date) {
    recordsUpTo = new Date(recordsUpTo);
    console.log(`Getting results submission info with records up to ${format(recordsUpTo, 'd MMM yyyy')}`);
    return await this.service.getSubmissionInfo(recordsUpTo);
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
  async deleteCompetitionResult(
    @Param('competitionId') competitionId: string,
    @Param('resultId') resultId: string,
    @Request() req: any,
  ) {
    console.log(`Deleting result with id ${resultId} from contest ${competitionId}`);
    return await this.service.deleteCompetitionResult(resultId, competitionId, req.user);
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
