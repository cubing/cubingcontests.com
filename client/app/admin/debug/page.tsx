"use client";

import React, { useContext, useState } from "react";
import { useMyFetch } from "~/helpers/customHooks.ts";
import { MainContext } from "~/helpers/contexts.ts";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import Button from "~/app/components/UI/Button.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";

const DebugPage = () => {
  const myFetch = useMyFetch();
  const { loadingId, resetMessagesAndLoadingId } = useContext(MainContext);

  const [debugInputValue, setDebugInputValue] = useState("");
  const [debugOutput, setDebugOutput] = useState("");
  const [email, setEmail] = useState("");

  const onDebugInputKeyDown = (e: React.KeyboardEvent) => {
    resetMessagesAndLoadingId();
    setDebugOutput("");

    console.log("Event:", e);

    const output = `key: "${e.key}"
keyCode: "${e.keyCode}"
nativeEvent.key: "${e.nativeEvent?.keyCode}"
nativeEvent.code: "${e.nativeEvent?.keyCode}"
nativeEvent.code: "${e.nativeEvent?.code}"`;

    setDebugOutput(output);
  };

  const sendEmail = async () => {
    setDebugOutput("");

    const { errors } = await myFetch.post("/debug-sending-email", { email }, {
      loadingId: "send_email_button",
    });

    if (!errors) setDebugOutput("Successfully sent email!");
  };

  return (
    <div>
      <div className="mx-auto px-3" style={{ maxWidth: "768px" }}>
        <h2 className="mb-5 text-center">Page for debugging</h2>
        <ToastMessages />

        <p className="mt-3 mb-4 fs-5" style={{ whiteSpace: "pre-wrap" }}>
          {debugOutput}
        </p>

        <FormTextInput
          title="Debug input"
          value={debugInputValue}
          setValue={setDebugInputValue}
          onKeyDown={onDebugInputKeyDown}
        />

        <h4 className="my-4">Test sending emails</h4>

        <FormTextInput
          title="Email address"
          value={email}
          setValue={setEmail}
        />

        <Button
          id="send_email_button"
          onClick={sendEmail}
          loadingId={loadingId}
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default DebugPage;
