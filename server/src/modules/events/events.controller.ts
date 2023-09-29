import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { EventsService } from './events.service';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '@sh/enums';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // GET /events
  @Get()
  async getEvents() {
    console.log('Getting events');
    return await this.eventsService.getEvents();
  }

  // GET /events/mod
  @Get('mod')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async getModEvents(@Request() req: any) {
    if (req.user.roles.includes(Role.Admin)) {
      console.log('Getting all events for admin');
      return await this.eventsService.getEvents({ includeHidden: true });
    } else {
      console.log('Getting events for moderator');
      return await this.eventsService.getEvents();
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

  // PATCH /events/:eventId
  @Patch(':eventId')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async updateEvent(@Param('eventId') eventId: string, @Body(new ValidationPipe()) updateEventDto: UpdateEventDto) {
    console.log(`Updating event with id ${eventId}`);
    return await this.eventsService.updateEvent(eventId, updateEventDto);
  }
}
