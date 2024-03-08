import { Body, Controller, Get, Param, Patch, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { EventsService } from './events.service';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Roles } from '~/src/helpers/roles.decorator';
import { Role } from '@sh/enums';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { LogType } from '~/src/helpers/enums';

@Controller('events')
export class EventsController {
  constructor(private readonly logger: MyLogger, private readonly eventsService: EventsService) {}

  // GET /events
  @Get()
  async getEvents() {
    return await this.eventsService.getFrontendEvents();
  }

  // GET /events/mod
  @Get('mod')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async getModEvents() {
    return await this.eventsService.getFrontendEvents({ includeHidden: true, populateRules: true });
  }

  // POST /events
  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async createEvent(@Body(new ValidationPipe()) createEventDto: CreateEventDto) {
    this.logger.logAndSave(`Creating new event with ID ${createEventDto.eventId}`, LogType.CreateEvent);

    return await this.eventsService.createEvent(createEventDto);
  }

  // PATCH /events/:eventId
  @Patch(':eventId')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async updateEvent(@Param('eventId') eventId: string, @Body(new ValidationPipe()) updateEventDto: UpdateEventDto) {
    this.logger.logAndSave(`Updating event with ID ${eventId}`, LogType.UpdateEvent);

    return await this.eventsService.updateEvent(eventId, updateEventDto);
  }
}
