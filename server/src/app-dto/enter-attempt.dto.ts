import { IsInt, IsNotEmpty, IsNumberString, IsString, Min } from 'class-validator';

export class EnterAttemptDto {
  @IsString()
  @IsNotEmpty()
  competitionWcaId: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsNumberString()
  roundNumber: string;

  @IsInt()
  @Min(1)
  registrantId: number;

  @IsInt()
  @Min(1)
  attemptNumber: number;

  @IsInt()
  attemptResult: number;
}
