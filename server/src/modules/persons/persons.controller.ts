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
} from '@nestjs/common';
import { PersonsService } from './persons.service';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '@sh/enums';
import { CreatePersonDto } from './dto/create-person.dto';

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
      return await this.personsService.getPersonById(personId);
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

  // POST /persons
  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async createPerson(@Body(new ValidationPipe()) createPersonDto: CreatePersonDto, @Request() req: any) {
    return await this.personsService.createPerson(createPersonDto, req.user);
  }

  // POST /persons/create-or-get
  @Post('create-or-get')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.User)
  async createOrGetPerson(@Body(new ValidationPipe()) createPersonDto: CreatePersonDto, @Request() req: any) {
    const person = await this.personsService.getPersonByWcaId(createPersonDto.wcaId);

    if (person) return person;
    else return await this.personsService.createPerson(createPersonDto, req.user);
  }
}
