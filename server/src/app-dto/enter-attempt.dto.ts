import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class EnterAttemptDto {
  @IsString()
  @IsNotEmpty()
  competitionWcaId: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsNumber()
  roundNumber: number;

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
