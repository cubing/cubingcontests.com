import { Body, Controller, Get, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { EventsService } from './events.service';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '@sh/enums';
import { CreateEventDto } from './dto/create-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // GET /events
  @Get()
  async getEvents() {
    console.log('Getting all events');
    return await this.eventsService.getEvents();
  }

  // POST /events
  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async createEvent(@Body(new ValidationPipe()) createEventDto: CreateEventDto) {
    console.log(`Creating new event with id ${createEventDto.eventId}`);
    return await this.eventsService.createEvent(createEventDto);
  }
}
