import { Body, Controller, Get, Post, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { PersonsService } from './persons.service';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '~/src/helpers/enums';
import { CreatePersonDto } from './dto/create-person.dto';

@Controller('persons')
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  // GET /persons?searchParam=[name]
  @Get()
  async getPersons(@Query('searchParam') searchParam: string) {
    console.log('Getting person' + (searchParam ? ` with search parameter: ${searchParam}` : ''));
    return await this.personsService.getPersons(searchParam);
  }

  // POST /persons
  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async createPerson(@Body(new ValidationPipe()) createPersonDto: CreatePersonDto) {
    console.log(`Creating new person with name ${createPersonDto.name}`);
    return await this.personsService.createPerson(createPersonDto);
  }
}
