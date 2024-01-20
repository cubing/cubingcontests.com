'use client';

import { useEffect } from 'react';

export const useScrollToTopForNewMessage = ({
  errorMessages,
  successMessage,
}: {
  errorMessages?: string[];
  successMessage?: string;
}) => {
  // Scroll to the top of the page when a new error message is shown
  useEffect(() => {
    if (successMessage || errorMessages?.some((el) => el !== '')) window.scrollTo(0, 0);
  }, [errorMessages]);
};
