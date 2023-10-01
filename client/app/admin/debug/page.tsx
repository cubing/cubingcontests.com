'use client';

import { useState } from 'react';
import FormTextInput from '@c/form/FormTextInput';

const DebugPage = () => {
  const [debugInputValue, setDebugInputValue] = useState('');
  const [debugOutput, setDebugOutput] = useState('');

  const onDebugInputKeyDown = (e: any) => {
    console.log('Event:', e);
    setDebugOutput(`key: "${e.key}", keyCode: "${e.keyCode}", which: "${e.which}"`);
  };

  return (
    <div>
      <div className="mx-auto px-3" style={{ maxWidth: '768px' }}>
        <h2 className="text-center">Page for debugging</h2>

        <p className="mt-5 mb-4 fs-5">{debugOutput}</p>

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
