"use client";

import { useContext, useState } from "react";
import { useMyFetch } from "~/helpers/customHooks.ts";
import Form from "~/app/components/form/Form.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import { MainContext } from "~/helpers/contexts.ts";
import { useParams } from "next/navigation";

const ResetPasswordPage = () => {
  const myFetch = useMyFetch();
  const { code } = useParams();
  const { changeErrorMessages, changeSuccessMessage } = useContext(MainContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");

  const handleSubmit = async () => {
    const tempErrors: string[] = [];

    if (!password) tempErrors.push("Please enter a password");
    else if (!passwordRepeat) tempErrors.push("Please confirm your password");
    else if (passwordRepeat !== password) tempErrors.push("The entered passwords do not match");

    if (tempErrors.length > 0) {
      changeErrorMessages(tempErrors);
    } else {
      const { errors } = await myFetch.post(
        "/auth/reset-password",
        { email, code, newPassword: password },
        { authorize: false, loadingId: "form_submit_button" },
      );

      if (!errors) {
        changeSuccessMessage("Your password has been successfully reset");

        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      }
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-center">Reset Password</h2>

      <Form onSubmit={handleSubmit}>
        <FormTextInput
          id="email"
          title="Email"
          value={email}
          setValue={setEmail}
          nextFocusTargetId="password"
          autoFocus
          className="mb-2"
        />
        <FormTextInput
          id="password"
          title="Password"
          value={password}
          setValue={setPassword}
          nextFocusTargetId="password_repeat"
          password
          className="mb-2"
        />
        <FormTextInput
          id="password_repeat"
          title="Repeat password"
          value={passwordRepeat}
          setValue={setPasswordRepeat}
          nextFocusTargetId="form_submit_button"
          password
        />
      </Form>
    </div>
  );
};

export default ResetPasswordPage;
