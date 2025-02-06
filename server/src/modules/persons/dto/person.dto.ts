import { IsIn, IsOptional, IsString, Matches, MinLength } from "class-validator";
import { Countries } from "~/helpers/Countries";
import { getMinLengthOpts, invalidCountryOpts } from "~/src/helpers/validation";
import { C } from "~/helpers/constants";
import { IPersonDto } from "~/helpers/types";

export class PersonDto implements IPersonDto {
  @IsString()
  @MinLength(3, getMinLengthOpts("person name", 3))
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(2, getMinLengthOpts("localized name", 2))
  localizedName?: string;

  @IsOptional()
  @IsString()
  @Matches(C.wcaIdRegex, { message: "Please enter a valid WCA ID" })
  wcaId?: string;

  @IsIn(Countries.map((el) => el.code), invalidCountryOpts)
  countryIso2: string;
}
