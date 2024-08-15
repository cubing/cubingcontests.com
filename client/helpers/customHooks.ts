'use client';

import { useContext, useEffect } from 'react';
import { MainContext } from '~/helpers/contexts';

export const useScrollToTopForNewMessage = () => {
  const { successMessage, errorMessages } = useContext(MainContext);

  // Scroll to the top of the page when a new error message is shown
  useEffect(() => {
    if (successMessage || errorMessages.some((el) => el !== '')) window.scrollTo(0, 0);
  }, [successMessage, errorMessages]);
};
