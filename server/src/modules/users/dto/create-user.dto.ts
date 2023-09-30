import { IsEmail, IsString, IsStrongPassword, Matches, MaxLength, MinLength } from 'class-validator';
import { IUser } from '~/src/helpers/interfaces/User';
import { getMaxLengthOpts, getMinLengthOpts } from '~/src/helpers/validation';

const passwordValidationMessage = `The password must satisfy the following requirements:

Minimum length of 10
At least one lowercase letter
At least one uppercase letter
At least one number
At least one special character`;

export class CreateUserDto implements IUser {
  @IsString()
  @MinLength(3, getMinLengthOpts('username', 3))
  @Matches(/^[a-z0-9_-]*$/, {
    message: 'The username can only contain alphanumeric characters, underscores and dashes',
  })
  username: string;

  @IsString()
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email: string;

  @IsString()
  @MaxLength(100, getMaxLengthOpts('password', 100))
  @IsStrongPassword({ minLength: 10 }, { message: passwordValidationMessage })
  password: string;
}
