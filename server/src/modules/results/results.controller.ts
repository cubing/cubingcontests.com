import { Body, Controller, Get, Param, Post, Query, UseGuards, ValidationPipe } from '@nestjs/common';
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

  @Get('records/:wcaequivalent') // GET /results/records/:wcaequivalent
  async getRecords(@Param('wcaequivalent') wcaEquivalent: string) {
    return await this.service.getRecords(wcaEquivalent);
  }

  @Get('submission-info') // GET /results/submission-info?records_up_to=DATE
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async getSubmissionInfo(@Query('records_up_to') recordsUpTo: string | Date) {
    recordsUpTo = new Date(recordsUpTo);
    console.log(`Getting results submission info with records up to ${format(recordsUpTo, 'd MMM yyyy')}`);
    return await this.service.getSubmissionInfo(recordsUpTo);
  }

  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async createResult(@Body(new ValidationPipe()) createResultDto: CreateResultDto) {
    console.log(`Creating new result for event ${createResultDto.eventId}`);
    return await this.service.createResult(createResultDto);
  }
}
