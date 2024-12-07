import { Body, Controller, Get, Post, Request, UseGuards, ValidationPipe } from "@nestjs/common";
import { CollectiveSolutionService } from "@m/collective-solution/collective-solution.service";
import { Role } from "@sh/enums";
import { Roles } from "~/src/helpers/roles.decorator";
import { RolesGuard } from "~/src/guards/roles.guard";
import { AuthenticatedGuard } from "~/src/guards/authenticated.guard";
import { MakeMoveDto } from "@m/collective-solution/dto/make-move.dto";

@Controller("collective-solution")
export class CollectiveSolutionController {
  constructor(private readonly service: CollectiveSolutionService) {}

  // POST /collective-solution
  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.User)
  async startNewSolution(@Request() req: any) {
    return await this.service.startNewSolution(req.user);
  }

  // POST /collective-solution/make-move
  @Post("make-move")
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(Role.User)
  async makeMove(@Body(new ValidationPipe()) makeMoveDto: MakeMoveDto, @Request() req: any) {
    return await this.service.makeMove(makeMoveDto, req.user);
  }
}
