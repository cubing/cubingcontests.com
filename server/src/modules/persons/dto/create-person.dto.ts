import { IsIn, IsString, MinLength } from 'class-validator';
import { IPerson } from '@sh/interfaces/Person';
import Countries from '@sh/Countries';

export class CreatePersonDto implements IPerson {
  @IsString()
  @MinLength(3)
  name: string;

  @IsIn(Countries.map((el) => el.code))
  countryId: string;
}
