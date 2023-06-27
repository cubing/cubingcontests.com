import { Body, Controller, Get, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { EventsService } from './events.service';
// import { AdminGuard } from '~/src/guards/admin.guard';
import { CreateEventDto } from './dto/create-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // GET /events
  @Get()
  // @UseGuards(AdminGuard)
  async getEvents() {
    return await this.eventsService.getEvents();
  }

  // POST /events
  @Post()
  // @UseGuards(AdminGuard)
  async createEvent(@Body(new ValidationPipe()) createEventDto: CreateEventDto) {
    return await this.eventsService.createEvent(createEventDto);
  }
}
