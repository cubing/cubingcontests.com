'use client';

import { useState } from 'react';
import FormTextInput from '@c/form/FormTextInput';

const DebugPage = () => {
  const [debugInputValue, setDebugInputValue] = useState('');
  const [debugOutput, setDebugOutput] = useState('');

  const onDebugInputKeyDown = (e: any) => {
    console.log('Event:', e);
    setDebugOutput(`Pressed key code: "${e.key}"`);
  };

  return (
    <div className="mx-auto">
      <h2>Page for debugging</h2>

      <p className="mt-5 mb-4 fs-5">{debugOutput}</p>

      <FormTextInput
        title="Debug input"
        value={debugInputValue}
        onChange={setDebugInputValue}
        onKeyDown={onDebugInputKeyDown}
      />
    </div>
  );
};

export default DebugPage;
