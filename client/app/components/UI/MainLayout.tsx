'use client';

import { useEffect, useState } from 'react';
import Navbar from '@c/UI/Navbar';
import Footer from '@c/UI/Footer';
import { MainContext, Theme } from '~/helpers/contexts';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>();

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
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <body
      data-bs-theme={theme}
      className={`cc-${theme}-layout min-vh-100 d-flex flex-column`}
      style={{ overflowX: 'hidden' }}
    >
      <MainContext.Provider value={{ theme, setTheme: changeTheme }}>
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
