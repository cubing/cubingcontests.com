import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { IUser } from '~/src/helpers/interfaces/User';

export class CreateUserDto implements IUser {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9_-]{5,}$/)
  @MinLength(4)
  username: string;

  @IsString()
  @MinLength(10)
  @MaxLength(64)
  password: string;
}
