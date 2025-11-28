"use client";

import Link from "next/link";
import { useContext, useState, useTransition } from "react";
import z from "zod";
import Form from "~/app/components/form/Form.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import { authClient } from "~/helpers/authClient.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { RegistrationFormValidator } from "~/helpers/validators/Auth.ts";

function RegisterPage() {
  const { changeErrorMessages, changeSuccessMessage } = useContext(MainContext);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    const parsed = RegistrationFormValidator.safeParse({
      username,
      email,
      password,
      passwordRepeat,
    });

    if (!parsed.success) {
      changeErrorMessages([z.prettifyError(parsed.error)]);
    } else {
      startTransition(async () => {
        const { error } = await authClient.signUp.email({
          username: parsed.data.username,
          email: parsed.data.email,
          password: parsed.data.password,
          name: "", // this field is not used for now
          callbackURL: `${process.env.NEXT_PUBLIC_BASE_URL}/login?email=${parsed.data.email}`, // same as on the link-expired page
        });

        if (error) {
          changeErrorMessages([error.message ?? error.statusText]);
        } else {
          changeSuccessMessage(
            "A verification link has been sent to your email. Please click the link in the email to finish your registration.",
          );
          setIsSubmitted(true);
          await authClient.signOut();
        }
      });
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-center">Register</h2>

      <Form buttonText="Register" onSubmit={handleSubmit} isLoading={isPending} disableControls={isSubmitted}>
        <FormTextInput
          title="Username"
          value={username}
          setValue={setUsername}
          nextFocusTargetId="email"
          autoFocus
          disabled={isSubmitted}
          className="mb-2"
        />
        <FormTextInput
          id="email"
          title="Email"
          value={email}
          setValue={setEmail}
          nextFocusTargetId="password"
          disabled={isSubmitted}
          className="mb-2"
        />
        <FormTextInput
          id="password"
          title="Password"
          value={password}
          setValue={setPassword}
          nextFocusTargetId="password_repeat"
          password
          disabled={isSubmitted}
          className="mb-2"
        />
        <FormTextInput
          id="password_repeat"
          title="Repeat password"
          value={passwordRepeat}
          setValue={setPasswordRepeat}
          nextFocusTargetId="form_submit_button"
          disabled={isSubmitted}
          password
        />
      </Form>

      <div className="fs-5 container mx-auto mt-4 px-3" style={{ maxWidth: "var(--cc-md-width)" }}>
        <Link href="/login">Log in</Link>
      </div>
    </div>
  );
}

export default RegisterPage;
