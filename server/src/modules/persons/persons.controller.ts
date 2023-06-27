import { Body, Controller, Get, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { PersonsService } from './persons.service';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '@sh/enums';
import { CreatePersonDto } from './dto/create-person.dto';

@Controller('persons')
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  // GET /persons
  @Get()
  async getPersons() {
    return await this.personsService.getPersons();
  }

  // POST /persons
  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async createPerson(@Body(new ValidationPipe()) createPersonDto: CreatePersonDto) {
    return await this.personsService.createPerson(createPersonDto);
  }
}
