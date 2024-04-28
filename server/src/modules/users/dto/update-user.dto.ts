import { IFeUser, IPerson } from '@sh/types';
import { IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserDto } from './create-user.dto';
import { CreatePersonDto } from '@m/persons/dto/create-person.dto';
import { Role } from '@sh/enums';

export class UpdateUserDto extends UserDto implements IFeUser {
  @ValidateNested()
  @Type(() => CreatePersonDto)
  person: IPerson;

  @IsEnum(Role, { each: true })
  roles: Role[];
}
