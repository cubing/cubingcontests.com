import { IsString, MaxLength, MinLength } from 'class-validator';
import IUser from '@sh/interfaces/User';

export class CreateUserDto implements IUser {
  @IsString()
  username: string;

  @IsString()
  @MinLength(10)
  @MaxLength(64)
  password: string;
}
