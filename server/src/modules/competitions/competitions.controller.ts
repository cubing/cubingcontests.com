import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Request,
  Body,
  Query,
  ValidationPipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { find } from 'geo-tz';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { CompetitionsService } from './competitions.service';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '@sh/enums';
import { RolesGuard } from '~/src/guards/roles.guard';

@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly service: CompetitionsService) {}

  // GET /competitions?region=...
  @Get()
  async getCompetitions(@Query('region') region: string) {
    console.log('Getting contests');
    return await this.service.getCompetitions(region);
  }

  // GET /competitions/mod
  @Get('mod')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async getModCompetitions(@Request() req: any) {
    console.log('Getting contests with moderator info');
    return await this.service.getModCompetitions(req.user);
  }

  // GET /competitions/timezone
  @Get('timezone')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async getTimezone(@Query('latitude') latitude: number, @Query('longitude') longitude: number) {
    console.log('Getting timezone');

    if (latitude > 90 || latitude < -90) throw new BadRequestException(`Invalid latitude: ${latitude}`);
    if (longitude > 180 || longitude < -180) throw new BadRequestException(`Invalid longitude: ${longitude}`);

    return { timezone: find(latitude, longitude)[0] };
  }

  // GET /competitions/:competition_id
  @Get(':competition_id')
  async getCompetition(@Param('competition_id') competitionId: string) {
    console.log(`Getting contest with id ${competitionId}`);
    return await this.service.getCompetition(competitionId);
  }

  // GET /competitions/mod/:competition_id
  @Get('mod/:competition_id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async getModCompetition(@Param('competition_id') competitionId: string, @Request() req: any) {
    console.log(`Getting contest with id ${competitionId} with moderator info`);
    return await this.service.getCompetition(competitionId, req.user);
  }

  // POST /competitions
  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async createCompetition(
    @Request() req: any, // this is passed in by the guards
    @Body(new ValidationPipe()) createCompetitionDto: CreateCompetitionDto,
  ) {
    console.log('Creating contest');
    return await this.service.createCompetition(createCompetitionDto, req.user.personId);
  }

  // PATCH /competitions/:competition-id?action=...
  @Patch(':competition_id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async updateCompetition(
    @Param('competition_id') competitionId: string,
    @Query('action') action: 'update' | 'change_state',
    @Body(new ValidationPipe()) updateCompetitionDto: UpdateCompetitionDto,
    @Request() req: any, // this is passed in by the guards
  ) {
    if (action === 'update') {
      console.log(`Updating contest ${competitionId}`);
      return await this.service.updateCompetition(competitionId, updateCompetitionDto, req.user);
    } else if (action === 'change_state') {
      console.log(`Setting state ${updateCompetitionDto.state} for contest ${competitionId}`);
      return await this.service.updateState(competitionId, updateCompetitionDto.state, req.user);
    } else {
      throw new BadRequestException(`Unsupported action when updating competition: ${action}`);
    }
  }
}
