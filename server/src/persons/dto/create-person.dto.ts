import { IsString, MinLength } from 'class-validator';
import { IPersonBase } from '@sh/interfaces/Person';

export class CreatePersonDto implements IPersonBase {
  @IsString()
  @MinLength(3)
  name: string;

  // ADD VALIDATION
  @IsString()
  @MinLength(2)
  countryId: string;
}
