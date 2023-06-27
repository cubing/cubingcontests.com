import { Body, Controller, Get, Post, UseGuards, ValidationPipe } from '@nestjs/common';
// import { AdminGuard } from '~/src/guards/admin.guard';
import { CreatePersonDto } from './dto/create-person.dto';
import { PersonsService } from './persons.service';

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
  // @UseGuards(AdminGuard)
  async createPerson(@Body(new ValidationPipe()) createPersonDto: CreatePersonDto) {
    return await this.personsService.createPerson(createPersonDto);
  }
}
