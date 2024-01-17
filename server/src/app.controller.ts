import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { find } from 'geo-tz';
import { AppService } from './app.service';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { getScorecards } from '~/src/scorecards/index.js';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '@sh/enums';
import { eventPopulateOptions } from '~/src/helpers/dbHelpers';
import { getWcifCompetition } from '@sh/sharedFunctions';
import { ContestDocument } from '~/src/models/contest.model';
import { EnterAttemptDto } from '~/src/app-dto/enter-attempt.dto';
import { LogType } from '~/src/helpers/enums';

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
  @Roles(Role.Admin, Role.Moderator)
  async getContestScorecards(@Param('competitionId') competitionId: string, @Res() res: any) {
    const contest = await this.contestModel
      .findOne({ competitionId })
      .populate(eventPopulateOptions.event)
      .populate({ ...eventPopulateOptions.rounds, populate: undefined }) // we don't need the results to be populated
      .exec();

    if (!contest) throw new BadRequestException(`Contest with ID ${competitionId} not found`);

    const buffer = await getScorecards(getWcifCompetition(contest));

    res.set({
      'Content-Type': 'application/pdf',
      // For now the file name is set on the frontend
      // 'Content-Disposition': `attachment; filename=${competitionId}_Scorecards.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Post('enter-attempt')
  async enterAttemptFromExternalDevice(@Body(new ValidationPipe()) enterAttemptDto: EnterAttemptDto) {
    this.logger.logAndSave(
      `Entering attempt ${enterAttemptDto.attemptResult} for event ${enterAttemptDto.eventId} from external device`,
      LogType.UpdateResult,
    );

    return await this.appService.enterAttemptFromExternalDevice(enterAttemptDto);
  }
}
