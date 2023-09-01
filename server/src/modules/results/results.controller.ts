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

  // GET /results/records/:wca_equivalent
  @Get('records/:wca_equivalent')
  async getRecords(@Param('wca_equivalent') wcaEquivalent: string) {
    return await this.service.getRecords(wcaEquivalent);
  }

  // GET /results/submission-info?records_up_to=...
  @Get('submission-info')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async getSubmissionInfo(@Query('records_up_to') recordsUpTo: string | Date) {
    recordsUpTo = new Date(recordsUpTo);
    console.log(`Getting results submission info with records up to ${format(recordsUpTo, 'd MMM yyyy')}`);
    return await this.service.getSubmissionInfo(recordsUpTo);
  }

  // POST /results/:round_id
  @Post(':round_id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async createResult(
    @Param('round_id') roundId: string,
    @Body(new ValidationPipe()) createResultDto: CreateResultDto,
    @Request() req: any,
  ) {
    console.log(`Creating new result for competition ${createResultDto.competitionId}, round ${roundId}`);
    return await this.service.createResult(createResultDto, roundId, req.user);
  }

  // DELETE /results/:competition_id/:result_id
  @Delete(':competition_id/:result_id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async deleteCompetitionResult(
    @Param('competition_id') competitionId: string,
    @Param('result_id') resultId: string,
    @Request() req: any,
  ) {
    console.log(`Deleting result with id ${resultId} from competition ${competitionId}`);
    return await this.service.deleteCompetitionResult(resultId, competitionId, req.user);
  }

  // POST /results
  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async submitResult(@Body(new ValidationPipe()) createResultDto: CreateResultDto) {
    console.log(`Submitting new result for event ${createResultDto.eventId}`);
    return await this.service.submitResult(createResultDto);
  }
}
