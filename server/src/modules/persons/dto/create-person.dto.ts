import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import Countries from '@sh/Countries';

export class CreatePersonDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  wcaId?: string;

  @IsIn(Countries.map((el) => el.code))
  countryIso2: string;
}
