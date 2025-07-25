import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from "class-validator";
import { Countries } from "~/helpers/Countries";
import { getMinLengthOpts, invalidCountryOpts } from "~/src/helpers/validation";
import { C } from "~/helpers/constants";
import { IPersonDto } from "~/helpers/types";

export class PersonDto implements IPersonDto {
  @IsString()
  @MinLength(3, getMinLengthOpts("person name", 3))
  @Matches(C.personNameRegex, {
    message: "The name cannot contain parentheses",
  })
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(2, getMinLengthOpts("localized name", 2))
  @Matches(C.personNameRegex, {
    message: "The localized name cannot contain parentheses",
  })
  localizedName?: string;

  @IsOptional()
  @IsString()
  @Matches(C.wcaIdRegex, { message: "Please enter a valid WCA ID" })
  wcaId?: string;

  @IsIn(Countries.map((el) => el.code), invalidCountryOpts)
  countryIso2: string;
}
