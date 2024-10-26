import { IsEmail, IsString, IsStrongPassword, Matches, MaxLength, MinLength } from "class-validator";
import { IUser } from "~/src/helpers/interfaces/User";
import { INVALID_EMAIL_MSG, PASSWORD_VALIDATION_MSG } from "~/src/helpers/messages";
import { getMaxLengthOpts, getMinLengthOpts } from "~/src/helpers/validation";

export class UserDto {
  @IsString()
  @MinLength(3, getMinLengthOpts("username", 3))
  @Matches(/^[a-z0-9_-]*$/, {
    message: "The username can only contain lowercase letters, numbers, underscores and dashes",
  })
  username: string;

  @IsEmail({}, { message: INVALID_EMAIL_MSG })
  @Matches(/^[^+]*$/, { message: "Sub-addresses are not permitted (you cannot use + in the email address)" })
  email: string;
}

export class CreateUserDto extends UserDto {
  // SAME AS IN reset-user-password.dto.ts
  @IsString()
  @MaxLength(60, getMaxLengthOpts("password", 60))
  @IsStrongPassword({ minLength: 10 }, { message: PASSWORD_VALIDATION_MSG })
  password: string;
}
