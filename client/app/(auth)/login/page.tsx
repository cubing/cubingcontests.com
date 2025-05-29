"use client";

import { useContext, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import Form from "~/app/components/form/Form.tsx";
import { MainContext } from "~/helpers/contexts.ts";
import { authClient } from "~/helpers/authClient.ts";
import { z } from "zod/v4";
import { LoginFormValidator } from "~/helpers/validators/Auth";

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { changeErrorMessages, changeSuccessMessage } = useContext(MainContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const email = searchParams.get("email");

    if (email) {
      const parsed = z.email().safeParse(email);

      if (!parsed.success) {
        changeErrorMessages([
          "An unknown error has occurred. Please try to register again.",
        ]);
      } else if (searchParams.get("error")) {
        router.push(`/register/link-expired?email=${parsed.data}`);
      } else {
        changeSuccessMessage(
          "Your email has been verified. You can now log in.",
        );
      }
    }
  }, [searchParams]);

  const handleSubmit = async () => {
    const parsed = LoginFormValidator.safeParse({ username, password });

    if (!parsed.success) {
      changeErrorMessages([z.prettifyError(parsed.error)]);
    } else {
      startTransition(async () => {
        const isEmailLogin = z.email().safeParse(username).success;
        const { error } = isEmailLogin
          ? await authClient.signIn.email({ email: username, password })
          : await authClient.signIn.username({ username, password });

        if (error) changeErrorMessages([error.message ?? error.statusText]);
        else router.replace(searchParams.get("redirect") || "/");
      });
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-center">Login</h2>

      <Form buttonText="Log in" onSubmit={handleSubmit} isLoading={isPending}>
        <FormTextInput
          id="username"
          title="Username or email"
          value={username}
          setValue={setUsername}
          nextFocusTargetId="password"
          autoFocus
          className="mb-3"
        />
        <FormTextInput
          id="password"
          title="Password"
          value={password}
          setValue={setPassword}
          password
          submitOnEnter
          className="mb-3"
        />
        <Link href="/forgot-password" className="d-block mt-4">
          Forgot password?
        </Link>
      </Form>

      <div
        className="container mt-4 mx-auto px-3 fs-5"
        style={{ maxWidth: "var(--cc-md-width)" }}
      >
        <Link href="/register">Create account</Link>
      </div>
    </div>
  );
};

export default LoginPage;
