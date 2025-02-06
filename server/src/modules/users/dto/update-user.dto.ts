import { IFeUser, IPerson } from "~/helpers/types";
import { IsEnum, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { UserDto } from "./create-user.dto";
import { PersonDto } from "@m/persons/dto/person.dto";
import { Role } from "~/helpers/enums";

export class UpdateUserDto extends UserDto implements IFeUser {
  @ValidateNested()
  @Type(() => PersonDto)
  person: IPerson;

  @IsEnum(Role, { each: true })
  roles: Role[];
}
