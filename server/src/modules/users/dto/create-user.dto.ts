import { IsEmail, IsNumber, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { IUser } from '~/src/helpers/interfaces/User';

export class CreateUserDto implements IUser {
  @IsNumber()
  personId: number;

  @IsString()
  @Matches(/^[a-z0-9_-]{5,}$/)
  @MinLength(4)
  username: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(10)
  @MaxLength(64)
  password: string;
}
