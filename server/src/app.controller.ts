import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { find } from 'geo-tz';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '@sh/enums';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('admin-stats')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async getAdminStats() {
    console.log('Getting admin stats');
    return await this.appService.getAdminStats();
  }

  // GET /timezone?latitude=...&longitude=...
  @Get('timezone')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async getTimezone(@Query('latitude') latitude: number, @Query('longitude') longitude: number) {
    console.log('Getting timezone');

    if (latitude > 90 || latitude < -90) throw new BadRequestException(`Invalid latitude: ${latitude}`);
    if (longitude > 180 || longitude < -180) throw new BadRequestException(`Invalid longitude: ${longitude}`);

    return { timezone: find(latitude, longitude)[0] };
  }
}
