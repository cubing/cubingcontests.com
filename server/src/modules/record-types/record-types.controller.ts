import { Body, Controller, Get, Post, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { LogType } from '~/src/helpers/enums';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { RolesGuard } from '~/src/guards/roles.guard';
import { Role } from '@sh/enums';
import { Roles } from '~/src/helpers/roles.decorator';
import { RecordTypesService } from './record-types.service';
import { UpdateRecordTypeDto } from './dto/update-record-type.dto';

@Controller('record-types')
@UseGuards(AuthenticatedGuard, RolesGuard)
@Roles(Role.Admin)
export class RecordTypesController {
  constructor(private readonly logger: MyLogger, private readonly service: RecordTypesService) {}

  @Get() // GET /record-types?active=true/false
  async getRecordTypes(@Query('active') active: boolean) {
    return await this.service.getRecordTypes({ active });
  }

  @Post() // POST /record-types
  async updateRecordTypes(@Body(new ValidationPipe()) updateRecordTypesDtoS: UpdateRecordTypeDto[]) {
    this.logger.logAndSave('Updating record types', LogType.UpdateRecordTypes);

    return await this.service.updateRecordTypes(updateRecordTypesDtoS);
  }
}
