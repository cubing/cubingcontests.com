import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCollectiveSolutionDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  scramble: string;
}
