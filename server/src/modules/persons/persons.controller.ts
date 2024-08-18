import {
  Body,
  Request,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
  BadRequestException,
  Param,
  Patch,
} from '@nestjs/common';
import { PersonsService } from './persons.service';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '@sh/enums';
import { PersonDto } from './dto/person.dto';

@Controller('persons')
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  // GET /persons?(name=...)(&exactMatch=true)(&personId=...)
  @Get()
  async getPersons(
    @Query('name') name = '',
    @Query('exactMatch') exactMatch = false,
    @Query('personId') personId: number | null = null,
  ) {
    if (name) {
      if (exactMatch) return await this.personsService.getPersonByName(name);
      else return await this.personsService.getPersonsByName(name);
    } else if (personId !== null) {
      return await this.personsService.getPersonByPersonId(personId);
    }

    throw new BadRequestException('Please provide a full name, part of a name, or a person ID.');
  }

  // GET /persons/mod
  @Get('mod')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async getModPersons(@Request() req: any) {
    return await this.personsService.getModPersons(req.user);
  }

  // GET /persons/:wcaId
  @Get(':wcaId')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.User)
  async getOrCreatePersonByWcaId(@Param('wcaId') wcaId: string, @Request() req: any) {
    return await this.personsService.getOrCreatePersonByWcaId(wcaId, { user: req.user });
  }

  // POST /persons
  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async createPerson(@Body(new ValidationPipe()) personDto: PersonDto, @Request() req: any) {
    return await this.personsService.createPerson(personDto, { user: req.user });
  }

  // POST /persons/create-or-get
  // @Post('create-or-get')
  // @UseGuards(AuthenticatedGuard, RolesGuard)
  // @Roles(Role.User)
  // async createOrGetPerson(@Body(new ValidationPipe()) personDto: PersonDto, @Request() req: any) {
  //   return await this.personsService.createPerson(personDto, { user: req.user });
  // }

  // PATCH /persons/:id
  @Patch(':id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async updatePerson(@Param('id') id: string, @Body(new ValidationPipe()) personDto: PersonDto, @Request() req: any) {
    return await this.personsService.updatePerson(id, personDto, req.user);
  }
}
