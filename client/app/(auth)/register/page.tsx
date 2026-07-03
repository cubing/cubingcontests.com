"use client";

import Link from "next/link";
import { useContext, useState, useTransition } from "react";
import useSWR from "swr";
import z from "zod";
import Form from "~/app/components/form/Form.tsx";
import FormCheckbox from "~/app/components/form/FormCheckbox.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import { authClient } from "~/helpers/auth-client.ts";
import { HAS_CREDENTIAL_AUTH } from "~/helpers/constants.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { SwrKey } from "~/helpers/swr-keys.ts";
import { RegistrationFormValidator } from "~/helpers/validators/Auth.ts";
import { getPrivacyPolicySF } from "~/server/server-functions/server-functions.ts";

function RegisterPage() {
  if (!HAS_CREDENTIAL_AUTH) return <p className="text-center">EMAIL + PASSWORD AUTHENTICATION IS NOT SUPPORTED</p>;

  const { changeErrorMessages, changeSuccessMessage } = useContext(MainContext);

  const { data: privacyPolicy, isLoading: isLoadingPrivacyPolicy } = useSWR(SwrKey.PrivacyPolicy, () =>
    getPrivacyPolicySF(),
  );
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPrivacyPolicyUnderstood, setIsPrivacyPolicyUnderstood] = useState(false);
  const [isSubmitting, startTransition] = useTransition();

  const isPending = isSubmitting || isLoadingPrivacyPolicy;

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
          name: parsed.data.username,
          callbackURL: `${process.env.NEXT_PUBLIC_BASE_URL}/login?email=${parsed.data.email}`, // same as on the link-expired page
        });

        if (error) {
          changeErrorMessages([error.message || error.statusText]);
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
    <section>
      <h2 className="mb-4 text-center">Register</h2>

      <Form
        buttonText="Register"
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        disableControls={isSubmitted || isPending || (!!privacyPolicy?.data && !isPrivacyPolicyUnderstood)}
      >
        <FormTextInput
          title="Username"
          value={username}
          setValue={setUsername}
          nextFocusTargetId="email"
          autoFocus
          disabled={isSubmitted || isPending}
          className="mb-2"
        />
        <FormTextInput
          id="email"
          title="Email"
          value={email}
          setValue={setEmail}
          nextFocusTargetId="password"
          disabled={isSubmitted || isPending}
          className="mb-2"
        />
        <FormTextInput
          id="password"
          title="Password"
          value={password}
          setValue={setPassword}
          nextFocusTargetId="password_repeat"
          password
          disabled={isSubmitted || isPending}
          className="mb-2"
        />
        <FormTextInput
          id="password_repeat"
          title="Repeat password"
          value={passwordRepeat}
          setValue={setPasswordRepeat}
          nextFocusTargetId="form_submit_button"
          disabled={isSubmitted || isPending}
          password
        />
        {privacyPolicy?.data && (
          <div className="d-flex mt-3 gap-2">
            <FormCheckbox
              title="I accept the"
              selected={isPrivacyPolicyUnderstood}
              setSelected={setIsPrivacyPolicyUnderstood}
              disabled={isSubmitted || isPending}
              noMargin
            />
            {z.url().safeParse(privacyPolicy.data).success ? (
              <a href={privacyPolicy.data} target="_blank" rel="noopener">
                Privacy Policy
              </a>
            ) : (
              <Link href="/privacy" target="_blank" prefetch={false}>
                Privacy Policy
              </Link>
            )}
          </div>
        )}
      </Form>

      <div className="fs-5 container mx-auto mt-4 px-3" style={{ maxWidth: "var(--rr-md-width)" }}>
        <Link href="/login" prefetch={false}>
          Log in
        </Link>
      </div>
    </section>
  );
}

export default RegisterPage;
