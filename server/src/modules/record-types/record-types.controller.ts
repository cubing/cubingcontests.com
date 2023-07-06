import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Role } from '~/src/helpers/enums';
import { Roles } from '~/src/helpers/roles.decorator';
import { RecordTypesService } from './record-types.service';
import { IRecordType } from '@sh/interfaces';

@Controller('record-types')
@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles(Role.Admin)
export class RecordTypesController {
  constructor(private readonly service: RecordTypesService) {}

  @Get() // GET /record-types
  async getRecordTypes() {
    console.log('Getting record types');
    return await this.service.getRecordTypes();
  }

  @Post() // POST /record-types
  async createOrEditRecordTypes(@Body() recordTypes: IRecordType[]) {
    console.log('Setting record types');
    return await this.service.createOrEditRecordTypes(recordTypes);
  }
}
