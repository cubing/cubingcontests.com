"use client";

import { useContext, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMyFetch } from "~/helpers/customHooks.ts";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import Form from "~/app/components/form/Form.tsx";
import { MainContext } from "~/helpers/contexts.ts";

const LoginPage = () => {
  const searchParams = useSearchParams();
  const myFetch = useMyFetch();
  const { changeErrorMessages, resetMessagesAndLoadingId } = useContext(MainContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    const tempErrors: string[] = [];

    if (!password) {
      tempErrors.push("Please enter a password");
      document.getElementById("password")?.focus();
    }
    if (!username) {
      tempErrors.push("Please enter a username or email address");
      document.getElementById("username")?.focus();
    }

    if (tempErrors.length > 0) {
      changeErrorMessages(tempErrors);
    } else {
      const { payload, errors } = await myFetch.post(
        "/auth/login",
        { username, password },
        { authorize: false, loadingId: "form_submit_button" },
      );

      if (!errors) {
        if (!payload.accessToken) {
          changeErrorMessages(["Access token not received"]);
        } else {
          localStorage.setItem("jwtToken", `Bearer ${payload.accessToken}`);

          const redirectUrl = searchParams.get("redirect");

          if (redirectUrl) window.location.replace(redirectUrl);
          else window.location.href = "/";
        }
      } else if (errors[0] === "NOT_VERIFIED_EMAIL_ERROR") {
        window.location.href = `/register/confirm-email?username=${username}`;
        return;
      }
    }
  };

  const changeUsername = (newValue: string) => {
    resetMessagesAndLoadingId();
    setUsername(newValue);
  };

  const changePassword = (newValue: string) => {
    resetMessagesAndLoadingId();
    setPassword(newValue);
  };

  return (
    <div>
      <h2 className="mb-4 text-center">Login</h2>

      <Form buttonText="Log in" onSubmit={handleSubmit}>
        <FormTextInput
          id="username"
          title="Username or email"
          value={username}
          setValue={changeUsername}
          nextFocusTargetId="password"
          autoFocus
          className="mb-3"
        />
        <FormTextInput
          id="password"
          title="Password"
          value={password}
          setValue={changePassword}
          password
          submitOnEnter
          className="mb-3"
        />
        <Link href="/reset-password" className="d-block mt-4">
          Forgot password?
        </Link>
      </Form>

      <div className="container mt-4 mx-auto px-3 fs-5" style={{ maxWidth: "768px" }}>
        <Link href="/register">Create account</Link>
      </div>
    </div>
  );
};

export default LoginPage;
