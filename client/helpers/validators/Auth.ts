import { z } from "zod";

const username = z.string().nonempty();
const email = z.email();
const password = z.string().nonempty();
const passwordRepeat = z.string().nonempty();

const passwordsDontMatchError = {
  error: "The passwords do not match.",
  path: ["Password"],
};

export const RegistrationFormValidator = z
  .strictObject({
    username,
    email,
    password,
    passwordRepeat,
  })
  .refine((val) => val.passwordRepeat === val.password, passwordsDontMatchError);

export const LoginFormValidator = z.strictObject({
  username,
  password,
});

export const ResetPasswordFormValidator = z
  .strictObject({
    password,
    passwordRepeat,
  })
  .refine((val) => val.passwordRepeat === val.password, passwordsDontMatchError);
