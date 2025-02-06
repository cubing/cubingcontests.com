import { IsIn, IsString } from "class-validator";
import { NxNMove, nxnMoves } from "~/helpers/types/NxNMove";
import { IMakeMoveDto } from "~/helpers/types";

export class MakeMoveDto implements IMakeMoveDto {
  @IsIn(nxnMoves)
  move: NxNMove;

  @IsString()
  lastSeenSolution: string;
}
