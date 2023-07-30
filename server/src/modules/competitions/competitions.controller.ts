import { Controller, Get, Post, Patch, Param, Request, Body, Query, ValidationPipe, UseGuards } from '@nestjs/common';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { CompetitionsService } from './competitions.service';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '~/src/helpers/enums';
import { RolesGuard } from '~/src/guards/roles.guard';

@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly service: CompetitionsService) {}

  // GET /competitions?region=Region
  @Get()
  async getCompetitions(@Query('region') region: string) {
    console.log('Getting competitions');
    return await this.service.getCompetitions(region);
  }

  // GET /competitions/mod
  @Get('mod')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async getModCompetitions(@Request() req: any) {
    console.log('Getting competitions');
    return await this.service.getModCompetitions(req.user.personId, req.user.roles);
  }

  // GET /competitions/:id
  @Get(':id')
  async getCompetition(@Param('id') competitionId: string) {
    console.log(`Getting competition with id ${competitionId}`);
    return await this.service.getCompetition(competitionId);
  }

  // GET /competitions/mod/:id
  @Get('mod/:id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async getModCompetition(@Param('id') competitionId: string) {
    console.log(`Getting competition with id ${competitionId} with moderator info`);
    return await this.service.getModCompetition(competitionId);
  }

  // POST /competitions
  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async createCompetition(
    @Request() req: any, // this is passed in by the guards
    @Body(new ValidationPipe()) createCompetitionDto: CreateCompetitionDto,
  ) {
    console.log('Creating competition');
    return await this.service.createCompetition(createCompetitionDto, req.user.personId);
  }

  // PATCH /competitions/:id
  @Patch(':id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async updateCompetition(
    @Param('id') competitionId: string,
    @Request() req: any, // this is passed in by the guards
    @Body(new ValidationPipe()) updateCompetitionDto: UpdateCompetitionDto,
  ) {
    console.log('Updating competition');
    return await this.service.updateCompetition(competitionId, updateCompetitionDto, req.user.roles);
  }

  // DELETE /competitions/:id
  // @Delete(':id')
  // @UseGuards(AuthenticatedGuard, RolesGuard)
  // @Roles(Role.Admin)
  // async deleteCompetition(@Param('id') competitionId: string) {
  //   console.log(`Deleting competition with id ${competitionId}`);
  //   return await this.service.deleteCompetition(competitionId);
  // }
}
