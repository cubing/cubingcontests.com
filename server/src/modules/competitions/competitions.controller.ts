import { Controller, Get, Post, Patch, Param, Request, Body, Query, ValidationPipe, UseGuards } from '@nestjs/common';
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

  // GET /competitions?region=Region
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
    return { timezone: find(latitude, longitude)[0] };
  }

  // GET /competitions/:id
  @Get(':id')
  async getCompetition(@Param('id') competitionId: string) {
    console.log(`Getting contest with id ${competitionId}`);
    return await this.service.getCompetition(competitionId);
  }

  // GET /competitions/mod/:id
  @Get('mod/:id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async getModCompetition(@Param('id') competitionId: string, @Request() req: any) {
    console.log(`Getting contest with id ${competitionId} with moderator info`);
    return await this.service.getModCompetition(competitionId, req.user);
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

  // PATCH /competitions/:id?action=change_state/post_results
  @Patch(':id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async updateCompetition(
    @Param('id') competitionId: string,
    @Request() req: any, // this is passed in by the guards
    @Body(new ValidationPipe()) updateCompetitionDto: UpdateCompetitionDto,
    @Query('action') action?: 'change_state' | 'post_results',
  ) {
    if (!action) {
      console.log(`Updating contest ${competitionId}`);
      return await this.service.updateCompetition(competitionId, updateCompetitionDto, req.user);
    } else if (action === 'post_results') {
      console.log(`Posting results for ${competitionId}`);
      return await this.service.postResults(competitionId, updateCompetitionDto, req.user);
    } else if (action === 'change_state') {
      console.log(`Setting state ${updateCompetitionDto.state} for contest ${competitionId}`);
      return await this.service.updateState(competitionId, updateCompetitionDto.state, req.user);
    }
  }
}
