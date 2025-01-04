import { IsIn, IsString } from "class-validator";
import { NxNMove, nxnMoves } from "~/shared/types/NxNMove";
import { IMakeMoveDto } from "~/shared/types";

export class MakeMoveDto implements IMakeMoveDto {
  @IsIn(nxnMoves)
  move: NxNMove;

  @IsString()
  lastSeenSolution: string;
}
