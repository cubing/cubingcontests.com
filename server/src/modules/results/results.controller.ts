import { Body, Controller, Get, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
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

  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async createResult(@Body(new ValidationPipe()) createResultDto: CreateResultDto) {
    return await this.service.createResult(createResultDto);
  }
}
