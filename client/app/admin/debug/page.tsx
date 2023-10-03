'use client';

import { useState } from 'react';
import FormTextInput from '@c/form/FormTextInput';

const DebugPage = () => {
  const [debugInputValue, setDebugInputValue] = useState('');
  const [debugOutput, setDebugOutput] = useState('');

  const onDebugInputKeyDown = (e: any) => {
    console.log('Event:', e);

    const output = `key: "${e.key}"
keyCode: "${e.keyCode}"
nativeEvent.key: "${e.nativeEvent?.keyCode}"
nativeEvent.code: "${e.nativeEvent?.keyCode}"
nativeEvent.code: "${e.nativeEvent?.code}"`;

    setDebugOutput(output);
  };

  return (
    <div>
      <div className="mx-auto px-3" style={{ maxWidth: '768px' }}>
        <h2 className="text-center">Page for debugging</h2>

        <p className="mt-5 mb-4 fs-5" style={{ whiteSpace: 'pre-wrap' }}>
          {debugOutput}
        </p>

        <FormTextInput
          title="Debug input"
          value={debugInputValue}
          onChange={setDebugInputValue}
          onKeyDown={onDebugInputKeyDown}
        />
      </div>
    </div>
  );
};

export default DebugPage;
