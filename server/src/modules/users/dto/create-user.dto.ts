import { IsEmail, IsString, IsStrongPassword, Matches, MaxLength, MinLength } from 'class-validator';
import { IUser } from '~/src/helpers/interfaces/User';

const passwordValidationMessage = `The password must satisfy the following requirements:

Minimum length of 10
At least one lowercase letter
At least one uppercase letter
At least one number
At least one special character`;

export class CreateUserDto implements IUser {
  @IsString()
  @MinLength(3)
  @Matches(/^[a-z0-9_-]*$/)
  username: string;

  @IsString()
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email: string;

  @IsString()
  @MaxLength(100, { message: 'The password cannot be longer than 100 characters' })
  @IsStrongPassword({ minLength: 10 }, { message: passwordValidationMessage })
  password: string;
}
