'use client';

import { useEffect, useState } from 'react';
import Navbar from '@c/UI/Navbar';
import Footer from '@c/UI/Footer';
import { MainContext, Theme } from '~/helpers/contexts';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingId, setLoadingId] = useState('');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');

    if (storedTheme) {
      setTheme(storedTheme as Theme);
    } else {
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    }
  }, []);

  const changeTheme = (newTheme: Theme) => {
    if (newTheme !== theme) {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    }
  };

  const changeErrorMessages = (newErrorMessages: string[]) => {
    // Don't change error messages from [] to [], cause that would trigger an unnecessary rerender
    if (errorMessages.length > 0 || newErrorMessages.length > 0) setErrorMessages(newErrorMessages);
    setSuccessMessage('');
    setLoadingId('');
  };

  const changeSuccessMessage = (newSuccessMessage: string) => {
    setSuccessMessage(newSuccessMessage);
    if (errorMessages.length > 0) setErrorMessages([]);
    setLoadingId('');
  };

  const changeLoadingId = (newLoadingId: string) => {
    setLoadingId(newLoadingId);
    if (errorMessages.length > 0) setErrorMessages([]);
    setSuccessMessage('');
  };

  const resetMessagesAndLoadingId = () => {
    if (errorMessages.length > 0) setErrorMessages([]);
    setSuccessMessage('');
    setLoadingId('');
  };

  const resetMessages = () => {
    if (errorMessages.length > 0) setErrorMessages([]);
    setSuccessMessage('');
  };

  return (
    <body
      data-bs-theme={theme}
      className={`cc-${theme}-layout min-vh-100 d-flex flex-column`}
      style={{ overflowX: 'hidden' }}
    >
      <MainContext.Provider
        value={{
          theme,
          setTheme: changeTheme,
          errorMessages,
          changeErrorMessages,
          successMessage,
          changeSuccessMessage,
          loadingId,
          changeLoadingId,
          resetMessagesAndLoadingId,
          resetMessages,
        }}
      >
        {theme && (
          <>
            <Navbar />
            <main className="container-md d-flex flex-column pt-4 px-0 pb-2 flex-grow-1">{children}</main>
            <Footer />
          </>
        )}
      </MainContext.Provider>
    </body>
  );
};

export default MainLayout;
