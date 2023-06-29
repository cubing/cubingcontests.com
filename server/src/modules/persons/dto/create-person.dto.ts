import { IsIn, IsString, MinLength } from 'class-validator';
import Countries from '@sh/Countries';

export class CreatePersonDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsIn(Countries.map((el) => el.code))
  countryId: string;
}
