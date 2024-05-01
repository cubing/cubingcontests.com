import { IsIn, IsString } from 'class-validator';
import { NxNMove, nxnMoves } from '@sh/types/NxNMove';
import { IMakeMoveDto } from '@sh/types';

export class MakeMoveDto implements IMakeMoveDto {
  @IsIn(nxnMoves)
  move: NxNMove;

  @IsString()
  lastSeenSolution: string;
}
