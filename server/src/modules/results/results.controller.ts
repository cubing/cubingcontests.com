import { Controller, Get, Param } from '@nestjs/common';
import { ResultsService } from './results.service';

@Controller('results')
export class ResultsController {
  constructor(private readonly service: ResultsService) {}

  @Get('records/:wcaequivalent') // GET /results/records/:wcaequivalent
  async getRecords(@Param('wcaequivalent') wcaEquivalent: string) {
    return await this.service.getRecords(wcaEquivalent);
  }
}
