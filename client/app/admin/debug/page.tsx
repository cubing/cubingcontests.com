"use client";

import { useContext, useState } from "react";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import Button from "~/app/components/UI/Button.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { MainContext } from "~/helpers/contexts.ts";

const DebugPage = () => {
  const { resetMessages } = useContext(MainContext);

  const [debugInputValue, setDebugInputValue] = useState("");
  const [debugOutput, setDebugOutput] = useState("");
  const [email, setEmail] = useState("");

  const onDebugInputKeyDown = (e: React.KeyboardEvent) => {
    resetMessages();
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
    throw new Error("NOT IMPLEMENTED");
    // setDebugOutput("");

    // const res = await myFetch.post("/debug-sending-email", { email }, {
    //   loadingId: "send_email_button",
    // });

    // if (res.success) setDebugOutput("Successfully sent email!");
  };

  return (
    <div>
      <div className="mx-auto px-3" style={{ maxWidth: "var(--cc-md-width)" }}>
        <h2 className="mb-5 text-center">Page for debugging</h2>
        <ToastMessages />

        <p className="fs-5 mt-3 mb-4" style={{ whiteSpace: "pre-wrap" }}>
          {debugOutput}
        </p>

        <FormTextInput
          title="Debug input"
          value={debugInputValue}
          setValue={setDebugInputValue}
          onKeyDown={onDebugInputKeyDown}
        />

        <h4 className="my-4">Test sending emails</h4>

        <FormTextInput title="Email address" value={email} setValue={setEmail} className="mb-3" />

        <Button
          id="send_email_button"
          onClick={sendEmail}
          // loadingId={loadingId}
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default DebugPage;
