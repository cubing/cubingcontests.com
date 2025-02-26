import { CustomErrorParams, z } from "zod";

const username = z.string().nonempty();
const email = z.string().email();
const password = z.string().nonempty();
const passwordRepeat = z.string().nonempty();

const passwordsDontMatchError: CustomErrorParams = {
  message: "The passwords do not match.",
  path: ["Password"],
};

export const RegistrationFormValidator = z.object({
  username,
  email,
  password,
  passwordRepeat,
}).refine(
  (values) => values.passwordRepeat === values.password,
  passwordsDontMatchError,
);

export const LoginFormValidator = z.object({
  username,
  password,
});

export const ResetPasswordFormValidator = z.object({
  password,
  passwordRepeat,
}).refine(
  (values) => values.passwordRepeat === values.password,
  passwordsDontMatchError,
);
