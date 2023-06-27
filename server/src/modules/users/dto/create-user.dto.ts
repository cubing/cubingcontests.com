import { IsLowercase, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import IUser from '@sh/interfaces/User';

export class CreateUserDto implements IUser {
  @IsString()
  @Matches(/^[A-Z][a-zA-Z -]{2,}$/)
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
