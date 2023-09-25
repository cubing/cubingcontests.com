import { Body, Request, Controller, Get, Post, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { PersonsService } from './persons.service';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '@sh/enums';
import { CreatePersonDto } from './dto/create-person.dto';

@Controller('persons')
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  // GET /persons?searchParam=...
  @Get()
  async getPersons(@Query('searchParam') searchParam: string) {
    return await this.personsService.getPersons(searchParam);
  }

  // GET /persons/total
  @Get('total')
  async getPersonsTotal() {
    console.log('Getting the total number of persons in the DB');
    return await this.personsService.getPersonsTotal();
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
