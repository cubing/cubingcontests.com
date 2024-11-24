import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, MaxLength } from "class-validator";
import { getMaxLengthOpts } from "~/src/helpers/validation";
import { INVALID_EMAIL_MSG, PASSWORD_VALIDATION_MSG } from "~/src/helpers/messages";

export class ResetUserPasswordDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  // COPIED FROM create-user.dto.ts
  @IsString()
  @MaxLength(60, getMaxLengthOpts("password", 60))
  @IsStrongPassword({ minLength: 10 }, { message: PASSWORD_VALIDATION_MSG })
  newPassword: string;
}
