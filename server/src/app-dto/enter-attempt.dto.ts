import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class EnterAttemptDto {
  @IsString()
  @IsNotEmpty()
  competitionWcaId: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsInt()
  @Min(1)
  roundNumber: number;

  @IsInt()
  @Min(1)
  registrantId: number;

  @IsInt()
  @Min(1)
  attemptNumber: number;

  @IsInt()
  attemptResult: number;
}
