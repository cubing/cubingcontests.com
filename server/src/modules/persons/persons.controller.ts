import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { PersonsService } from "./persons.service";
import { MyLogger } from "@m/my-logger/my-logger.service";
import { AuthenticatedGuard } from "~/src/guards/authenticated.guard";
import { RolesGuard } from "~/src/guards/roles.guard";
import { Roles } from "~/src/helpers/roles.decorator";
import { Role } from "~/shared/enums";
import { PersonDto } from "./dto/person.dto";
import { LogType } from "~/src/helpers/enums";
import { IPartialUser } from "~/src/helpers/interfaces/User";

@Controller("persons")
export class PersonsController {
  constructor(private readonly logger: MyLogger, private readonly personsService: PersonsService) {}

  // GET /persons?(name=...)(&exactMatch=true)(&personId=...)
  @Get()
  async getPersons(
    @Query("name") name = "",
    @Query("exactMatch") exactMatch = false,
    @Query("personId") personId?: number,
  ) {
    if (name) {
      if (exactMatch) return await this.personsService.getPersonByName(name);
      else return await this.personsService.getPersonsByName(name);
    } else if (personId !== undefined) {
      return await this.personsService.getPersonByPersonId(personId);
    }

    throw new BadRequestException("Please provide a full name, part of a name, or a person ID.");
  }

  // GET /persons/mod
  @Get("mod")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async getModPersons(@Request() req: any) {
    this.logger.logAndSave("Getting mod persons", LogType.GetModPersons);

    return await this.personsService.getModPersons(req.user);
  }

  // GET /persons/:wcaId
  @Get(":wcaId")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.User)
  async getOrCreatePersonByWcaId(@Param("wcaId") wcaId: string, @Request() req: any) {
    this.logger.log(`Getting or creating person with WCA ID ${wcaId}`);

    return await this.personsService.getOrCreatePersonByWcaId(wcaId, { user: req.user });
  }

  // POST /persons/no-wcaid(?ignoreDuplicate=true)
  @Post("no-wcaid")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async createNoWcaIdPerson(
    @Body(new ValidationPipe()) personDto: PersonDto,
    @Request() req: any,
    @Query("ignoreDuplicate") ignoreDuplicate?: boolean,
  ) {
    if (personDto.wcaId) throw new BadRequestException("This endpoint is only for creating persons without a WCA ID");
    this.checkCanIgnoreDuplicate(req.user, ignoreDuplicate);

    return await this.personsService.createPerson(personDto, { user: req.user, ignoreDuplicate });
  }

  // PATCH /persons/:id(?ignoreDuplicate=true)
  @Patch(":id")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin, Role.Moderator)
  async updatePerson(
    @Param("id") id: string,
    @Body(new ValidationPipe()) personDto: PersonDto,
    @Request() req: any,
    @Query("ignoreDuplicate") ignoreDuplicate?: boolean,
  ) {
    this.checkCanIgnoreDuplicate(req.user, ignoreDuplicate);

    return await this.personsService.updatePerson(id, personDto, req.user, { ignoreDuplicate });
  }

  // PATCH /persons/:id/approve
  @Patch(":id/approve")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async approvePerson(@Param("id") id: string) {
    return await this.personsService.approvePerson({ id });
  }

  // DELETE /persons/:id
  @Delete(":id")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.Admin)
  async deletePerson(@Param("id") id: string) {
    return await this.personsService.deletePerson(id);
  }

  private checkCanIgnoreDuplicate(user: IPartialUser, ignoreDuplicate?: boolean) {
    if (!user.roles.includes(Role.Admin) && ignoreDuplicate) {
      throw new BadRequestException("You are unauthorized to create duplicate competitors");
    }
  }
}
