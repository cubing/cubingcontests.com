import { IsIn, IsString } from 'class-validator';
import { NxNMove, nxnMoves } from '@sh/types/NxNMove';

export class MakeMoveDto {
  @IsIn(nxnMoves)
  move: NxNMove;

  @IsString()
  lastSeenSolution: string;
}
