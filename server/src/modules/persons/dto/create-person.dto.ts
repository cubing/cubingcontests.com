import { IsIn, IsString, Matches } from 'class-validator';
import Countries from '@sh/Countries';

export class CreatePersonDto {
  @IsString()
  @Matches(/^[A-Z][a-z -]{2,}$/)
  name: string;

  @IsIn(Countries.map((el) => el.code))
  countryId: string;
}
