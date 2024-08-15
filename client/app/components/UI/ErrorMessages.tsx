'use client';

import { useContext } from 'react';
import { MainContext } from '~/helpers/contexts';

const ErrorMessages = () => {
  const { errorMessages } = useContext(MainContext);

  return errorMessages.map((message, index) => (
    <div key={index} className="alert alert-danger" style={{ whiteSpace: 'pre-wrap' }} role="alert">
      {message}
    </div>
  ));
};

export default ErrorMessages;
