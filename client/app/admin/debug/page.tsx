'use client';

import { useState } from 'react';
import FormTextInput from '@c/form/FormTextInput';
import Button from '~/app/components/Button';
import myFetch from '~/helpers/myFetch';
import ErrorMessages from '~/app/components/ErrorMessages';

const DebugPage = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [debugInputValue, setDebugInputValue] = useState('');
  const [debugOutput, setDebugOutput] = useState('');
  const [email, setEmail] = useState('');

  const onDebugInputKeyDown = (e: any) => {
    resetOutput();

    console.log('Event:', e);

    const output = `key: "${e.key}"
keyCode: "${e.keyCode}"
nativeEvent.key: "${e.nativeEvent?.keyCode}"
nativeEvent.code: "${e.nativeEvent?.keyCode}"
nativeEvent.code: "${e.nativeEvent?.code}"`;

    setDebugOutput(output);
  };

  const sendEmail = async () => {
    resetOutput();

    const { errors } = await myFetch.post('/debug-sending-email', { email });

    if (errors) {
      setErrorMessages(errors);
    } else {
      setDebugOutput('Successfully sent email!');
    }
  };

  const resetOutput = () => {
    setErrorMessages([]);
    setDebugOutput('');
  };

  return (
    <div>
      <div className="mx-auto px-3" style={{ maxWidth: '768px' }}>
        <h2 className="mb-5 text-center">Page for debugging</h2>
        <ErrorMessages errorMessages={errorMessages} />

        <p className="mt-3 mb-4 fs-5" style={{ whiteSpace: 'pre-wrap' }}>
          {debugOutput}
        </p>

        <FormTextInput
          title="Debug input"
          value={debugInputValue}
          setValue={setDebugInputValue}
          onKeyDown={onDebugInputKeyDown}
        />

        <h4 className="my-4">Test sending emails</h4>

        <FormTextInput title="Email address" value={email} setValue={setEmail} />

        <Button text="Send" onClick={sendEmail} />
      </div>
    </div>
  );
};

export default DebugPage;
