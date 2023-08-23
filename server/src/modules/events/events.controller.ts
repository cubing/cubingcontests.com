import { Body, Controller, Get, Post, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { EventsService } from './events.service';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '@sh/enums';
import { CreateEventDto } from './dto/create-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // GET /events?submission_based=true
  @Get()
  async getEvents(@Query('submission_based') submissionBased?: boolean) {
    if (!submissionBased) {
      console.log('Getting all events');
      return await this.eventsService.getEvents();
    } else {
      console.log('Getting all events that allow submissions');
      return await this.eventsService.getSubmissionBasedEvents();
    }
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
