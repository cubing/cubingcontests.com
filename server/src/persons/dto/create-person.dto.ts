import { IsNumber, IsString, Min, MinLength } from 'class-validator';
import IPerson from '@sh/interfaces/Person';

export class CreatePersonDto implements IPerson {
  @IsNumber()
  @Min(1)
  personId: number;

  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(2)
  countryId: string;
}
