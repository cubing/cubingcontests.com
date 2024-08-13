import { IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString, Min } from 'class-validator';

export class EnterAttemptDto {
  @IsString()
  @IsNotEmpty()
  competitionWcaId: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsNumberString()
  roundNumber: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  registrantId?: number;

  @IsOptional()
  @IsString()
  wcaId?: string;

  @IsInt()
  @Min(1)
  attemptNumber: number;

  @IsInt()
  attemptResult: number;
}
