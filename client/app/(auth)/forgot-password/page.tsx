"use client";

import { useContext, useState, useTransition } from "react";
import { z } from "zod/v4";
import Form from "~/app/components/form/Form.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import { MainContext } from "~/helpers/contexts.ts";
import { authClient } from "~/helpers/authClient";

const RequestPasswordResetPage = () => {
  const { changeErrorMessages, changeSuccessMessage } = useContext(MainContext);

  const [email, setEmail] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    const parsed = z.email().safeParse(email);

    if (!parsed.success) {
      changeErrorMessages(["Please enter a valid email address"]);
      document.getElementById("email")?.focus();
    } else {
      startTransition(async () => {
        const { error } = await authClient.forgetPassword({
          email,
          redirectTo: "/reset-password",
        });

        if (error) {
          changeErrorMessages([error.message ?? error.statusText]);
        } else {
          changeSuccessMessage(
            "A password reset link will be sent to your email if the entered email address is correct",
          );
          setIsDisabled(true);
        }
      });
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-center">Forgot Password</h2>

      <Form
        onSubmit={handleSubmit}
        disableControls={isDisabled}
        isLoading={isPending}
      >
        <FormTextInput
          id="email"
          title="Email address"
          value={email}
          setValue={setEmail}
          nextFocusTargetId="form_submit_button"
          autoFocus
        />
      </Form>
    </div>
  );
};

export default RequestPasswordResetPage;
