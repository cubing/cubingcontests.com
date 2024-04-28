import { Body, Request, Controller, Get, Post, UseGuards, ValidationPipe, Param } from '@nestjs/common';
import { CollectiveSolutionService } from '@m/collective-solution/collective-solution.service';
import { Role } from '@sh/enums';
import { NxNMove } from '@sh/types';
import { Roles } from '~/src/helpers/roles.decorator';
import { RolesGuard } from '~/src/guards/roles.guard';
import { AuthenticatedGuard } from '~/src/guards/authenticated.guard';
import { CreateCollectiveSolutionDto } from '@m/collective-solution/dto/create-collective-solution.dto';
import { MakeMoveDto } from '@m/collective-solution/dto/make-move.dto';

@Controller('collective-solution')
export class CollectiveSolutionController {
  constructor(private readonly service: CollectiveSolutionService) {}

  // GET /collective-solution
  @Get()
  async getCollectiveSolution() {
    return await this.service.getCollectiveSolution();
  }

  // POST /collective-solution
  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.User)
  async startNewSolution(
    @Body(new ValidationPipe()) createCollectiveSolutionDto: CreateCollectiveSolutionDto,
    @Request() req: any,
  ) {
    return await this.service.startNewSolution(createCollectiveSolutionDto, req.user);
  }

  // POST /collective-solution/make-move
  @Post('make-move')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.User)
  async makeMove(@Body(new ValidationPipe()) makeMoveDto: MakeMoveDto, @Request() req: any) {
    return await this.service.makeMove(makeMoveDto, req.user);
  }
}
