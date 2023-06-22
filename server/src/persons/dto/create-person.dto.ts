import { IsNumber, IsString, Min, MinLength } from 'class-validator';

export class CreatePersonDto {
  @IsNumber()
  @Min(1)
  personId: number;

  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(2)
  country: string;
}
