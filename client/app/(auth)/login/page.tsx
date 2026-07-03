"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState, useTransition } from "react";
import { z } from "zod";
import SignInWithGoogleButton from "~/app/(auth)/login/SignInWithGoogleButton.tsx";
import Form from "~/app/components/form/Form.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import Button from "~/app/components/UI/Button.tsx";
import { authClient } from "~/helpers/auth-client.ts";
import { HAS_CREDENTIAL_AUTH, HAS_GOOGLE_AUTH, HAS_WCA_AUTH } from "~/helpers/constants.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { LoginFormValidator } from "~/helpers/validators/Auth.ts";

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { changeErrorMessages, changeSuccessMessage } = useContext(MainContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPendingWcaSignIn, setIsPendingWcaSignIn] = useState(false);
  const [isPendingGoogleSignIn, setIsPendingGoogleSignIn] = useState(false);
  const [isPendingSignIn, startSignInTransition] = useTransition();

  const isPending = isPendingSignIn || isPendingWcaSignIn || isPendingGoogleSignIn;
  const redirectUrl = searchParams.get("redirect") || "/";

  useEffect(() => {
    const email = searchParams.get("email");
    if (email) {
      const parsed = z.email().safeParse(email);

      if (!parsed.success) {
        changeErrorMessages(["An unknown error has occurred. Please try to register again."]);
      } else if (searchParams.get("error")) {
        router.push(`/register/link-expired?email=${parsed.data}`);
      } else {
        changeSuccessMessage("Your email has been verified. You can now log in.");
      }
    }
  }, [searchParams]);

  const signIn = () => {
    const parsed = LoginFormValidator.safeParse({ username, password });

    if (!parsed.success) {
      changeErrorMessages([z.prettifyError(parsed.error)]);
    } else {
      startSignInTransition(async () => {
        const isEmailLogin = z.email().safeParse(username).success;
        const { error } = isEmailLogin
          ? await authClient.signIn.email({ email: username, password })
          : await authClient.signIn.username({ username, password });

        if (error) changeErrorMessages([error.message || error.statusText]);
        else router.replace(redirectUrl);
      });
    }
  };

  const signInWithWca = async () => {
    setIsPendingWcaSignIn(true);
    const { error } = await authClient.signIn.oauth2({
      providerId: "wca",
      callbackURL: redirectUrl,
      newUserCallbackURL: "/user/settings?status=signup-success",
      // errorCallbackURL: "/oauth-error", // this is currently broken in Better Auth; see next.config.ts
    });

    if (error) {
      changeErrorMessages([error.message || error.statusText]);
      setIsPendingWcaSignIn(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsPendingGoogleSignIn(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: redirectUrl,
    });

    if (error) {
      changeErrorMessages([error.message || error.statusText]);
      setIsPendingGoogleSignIn(false);
    }
  };

  return (
    <section>
      <h2 className="mb-4 text-center">Login</h2>

      {HAS_CREDENTIAL_AUTH && (
        <Form buttonText="Log in" onSubmit={signIn} disableControls={isPending} isLoading={isPendingSignIn}>
          <FormTextInput
            id="username"
            title="Username or email"
            value={username}
            setValue={setUsername}
            nextFocusTargetId="password"
            disabled={isPending}
            autoFocus
            className="mb-3"
          />
          <FormTextInput
            id="password"
            title="Password"
            value={password}
            setValue={setPassword}
            disabled={isPending}
            password
            nextFocusTargetId="form_submit_button"
            className="mb-3"
          />
          <Link href="/forgot-password" className="d-block mt-4">
            Forgot password?
          </Link>
        </Form>
      )}

      <div className="fs-5 container mx-auto mt-4 px-3" style={{ maxWidth: "var(--rr-md-width)" }}>
        {HAS_CREDENTIAL_AUTH && <Link href="/register">Sign up using email</Link>}

        <div className="d-flex mt-4 flex-wrap gap-3 align-items-center">
          {HAS_WCA_AUTH && (
            <Button
              onClick={signInWithWca}
              disabled={isPending}
              isLoading={isPendingWcaSignIn}
              className="d-block px-4"
            >
              <div className="d-flex gap-2 text-nowrap align-items-center">
                <Image src="/wca_logo.svg" height={30} width={30} alt="WCA" />
                Sign in with WCA
              </div>
            </Button>
          )}
          {HAS_GOOGLE_AUTH && <SignInWithGoogleButton onClick={signInWithGoogle} disabled={isPending} />}
        </div>
      </div>
    </section>
  );
}

export default LoginPage;
