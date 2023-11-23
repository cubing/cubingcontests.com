import { BadRequestException, Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { find } from 'geo-tz';
import { getScorecards } from '~/src/scorecards/index.js';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '@sh/enums';
import { AppService } from './app.service';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { ContestDocument } from '~/src/models/contest.model';

@Controller()
export class AppController {
  constructor(
    private readonly logger: MyLogger,
    private readonly appService: AppService,
    @InjectModel('Competition') private readonly contestModel: Model<ContestDocument>,
  ) {}

  @Get('admin-stats')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async getAdminStats() {
    return await this.appService.getAdminStats();
  }

  // GET /timezone?latitude=...&longitude=...
  @Get('timezone')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async getTimezone(@Query('latitude') latitude: number, @Query('longitude') longitude: number) {
    this.logger.log(`Getting time zone for coordinates ${latitude}, ${longitude}`);

    if (latitude > 90 || latitude < -90) throw new BadRequestException(`Invalid latitude: ${latitude}`);
    if (longitude > 180 || longitude < -180) throw new BadRequestException(`Invalid longitude: ${longitude}`);

    return { timezone: find(latitude, longitude)[0] };
  }

  @Get('scorecards/:competitionId')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async getContestScorecards(@Param('competitionId') competitionId: string, @Res() res: any) {
    const contest = await this.contestModel
      .findOne({ competitionId })
      .populate({ path: 'events.event', model: 'Event' })
      .exec();

    if (!contest) throw new BadRequestException(`Contest with ID ${competitionId} not found`);

    // To-Do: REMOVE HARD-CODING
    const buffer = await getScorecards(contest.name, contest.events[0].event.name, 1, '3:00');

    res.set({
      'Content-Type': 'application/pdf',
      // For now the file name is set on the frontend
      // 'Content-Disposition': `attachment; filename=${competitionId}_Scorecards.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
