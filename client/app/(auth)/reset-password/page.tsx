"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState, useTransition } from "react";
import z from "zod";
import Form from "~/app/components/form/Form.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import { authClient } from "~/helpers/auth-client.ts";
import { HAS_CREDENTIAL_AUTH } from "~/helpers/constants.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { ResetPasswordFormValidator } from "~/helpers/validators/Auth.ts";

function ResetPasswordPage() {
  if (!HAS_CREDENTIAL_AUTH) return <p className="text-center">EMAIL + PASSWORD AUTHENTICATION IS NOT SUPPORTED</p>;

  const router = useRouter();
  const searchParams = useSearchParams();
  const { changeErrorMessages, changeSuccessMessage } = useContext(MainContext);

  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [isDisabled, setIsDisabled] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (searchParams.get("error") || !searchParams.get("token")) {
      changeErrorMessages(["An unknown error has occurred. Please try to reset your password again."]);
    } else {
      setIsDisabled(false);
    }
  }, [searchParams]);

  const handleSubmit = () => {
    const parsed = ResetPasswordFormValidator.safeParse({ password, passwordRepeat });

    if (!parsed.success) {
      changeErrorMessages([z.prettifyError(parsed.error)]);
    } else {
      startTransition(async () => {
        const { error } = await authClient.resetPassword({
          newPassword: password,
          token: searchParams.get("token")!,
        });

        if (error) {
          changeErrorMessages([error.message || error.statusText]);
        } else {
          changeSuccessMessage("Your password has been successfully reset");
          setIsDisabled(true);

          setTimeout(() => router.push("/login"), 2000);
        }
      });
    }
  };

  return (
    <section>
      <h2 className="mx-3 mb-4 text-center">Reset Password</h2>

      <Form onSubmit={handleSubmit} disableControls={isDisabled} isLoading={isPending}>
        <FormTextInput
          id="password"
          title="Password"
          value={password}
          setValue={setPassword}
          nextFocusTargetId="password_repeat"
          password
          autoFocus
          disabled={isPending || isPending}
          className="mb-2"
        />
        <FormTextInput
          id="password_repeat"
          title="Repeat password"
          value={passwordRepeat}
          setValue={setPasswordRepeat}
          nextFocusTargetId="form_submit_button"
          password
          disabled={isPending || isPending}
        />
      </Form>
    </section>
  );
}

export default ResetPasswordPage;
