import { IsEnum, IsIn, IsString, MinLength } from 'class-validator';
import { IPersonBase } from '@sh/interfaces/Person';
import Countries from '@sh/Countries';

export class CreatePersonDto implements IPersonBase {
  @IsString()
  @MinLength(3)
  name: string;

  @IsIn(Countries.map((el) => el.code))
  countryId: string;
}
