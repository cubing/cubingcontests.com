"use client";

import { useAction } from "next-safe-action/hooks";
import { useContext, useState } from "react";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import Button from "~/app/components/UI/Button.tsx";
import { MainContext } from "~/helpers/contexts.ts";
import { useSession } from "~/helpers/hooks.ts";
import { getActionError } from "~/helpers/utility-functions.ts";
import { sendDebugEmailSF } from "~/server/server-functions/user-server-functions.ts";

function DebugScreen() {
  const { member } = useSession();
  const { changeErrorMessages, resetMessages } = useContext(MainContext);

  const { executeAsync: sendDebugEmail, isPending: isSendingEmail } = useAction(sendDebugEmailSF);
  const [debugOutput, setDebugOutput] = useState("");
  const [emailAddress, setEmailAddress] = useState("");

  const sendEmail = async () => {
    resetMessages();
    setDebugOutput("");

    const res = await sendDebugEmail({ emailAddress });

    if (res.serverError || res.validationErrors) {
      changeErrorMessages([getActionError(res)]);
    } else {
      resetMessages();
      setDebugOutput("Successfully sent email!");
    }
  };

  return (
    <>
      <p className="fs-5 mt-3 mb-4" style={{ whiteSpace: "pre-wrap" }}>
        {debugOutput || "<debug output>"}
      </p>

      <h4 className="my-4">Test sending emails</h4>

      <FormTextInput
        title="Email address"
        value={emailAddress}
        setValue={setEmailAddress}
        disabled={isSendingEmail}
        className="mb-3"
      />

      <Button onClick={sendEmail} isLoading={isSendingEmail}>
        Send
      </Button>

      <h4 className="my-4">Version</h4>
      <p>This instance is running on RecordRanks version {process.env.NEXT_PUBLIC_VERSION || "UNKNOWN"}</p>
      <p>Build date: {process.env.NEXT_PUBLIC_BUILD_DATE || "UNKNOWN"}</p>

      <h4 className="my-4">Member data</h4>
      <code>{JSON.stringify(member, null, 2)}</code>

      <h4 className="my-4">Environment variables (client-side)</h4>
      <code>
        NEXT_PUBLIC_BASE_URL={process.env.NEXT_PUBLIC_BASE_URL}
        <br />
        NEXT_PUBLIC_PROJECT_NAME={process.env.NEXT_PUBLIC_PROJECT_NAME}
        <br />
        NEXT_PUBLIC_AUTH_PROVIDERS={process.env.NEXT_PUBLIC_PROJECT_NAME}
        <br />
        NEXT_PUBLIC_STORAGE_PUBLIC_BUCKET_BASE_URL={process.env.NEXT_PUBLIC_STORAGE_PUBLIC_BUCKET_BASE_URL}
        <br />
        NEXT_PUBLIC_MULTITENANCY_ENABLED={process.env.NEXT_PUBLIC_MULTITENANCY_ENABLED}
      </code>
    </>
  );
}

export default DebugScreen;
