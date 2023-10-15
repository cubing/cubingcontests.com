import { IsIn, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import Countries from '@sh/Countries';
import { getMinLengthOpts, invalidCountryOpts } from '~/src/helpers/validation';
import C from '@sh/constants';

export class CreatePersonDto {
  @IsString()
  @MinLength(3, getMinLengthOpts('person name', 3))
  @Matches(/^[^()]*$/, { message: 'Parentheses are not allowed in names' })
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(2, getMinLengthOpts('localized name', 2))
  localizedName?: string;

  @IsOptional()
  @IsString()
  @Matches(C.wcaIdRegex, { message: 'Please enter a valid WCA ID' })
  wcaId?: string;

  // Allow all countries except the online option
  @IsIn(Countries.slice(1).map((el) => el.code), invalidCountryOpts)
  countryIso2: string;
}
