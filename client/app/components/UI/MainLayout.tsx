"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "~/app/components/UI/Navbar.tsx";
import Footer from "~/app/components/UI/Footer.tsx";
import { MainContext, Theme } from "~/helpers/contexts.ts";
import { authClient } from "~/helpers/authClient.ts";

type Props = {
  children: React.ReactNode;
  initSession: typeof authClient.$Infer.Session | null;
};

const MainLayout = ({ children, initSession }: Props) => {
  const pathname = usePathname();

  const [theme, setTheme] = useState<Theme>("dark");
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");

    if (storedTheme) {
      setTheme(storedTheme as Theme);
    } else {
      localStorage.setItem("theme", "dark");
    }
  }, []);

  useEffect(() => {
    resetMessages();
  }, [pathname]);

  const changeTheme = (newTheme: Theme) => {
    if (newTheme !== theme) {
      setTheme(newTheme);
      localStorage.setItem("theme", newTheme);
    }
  };

  const changeErrorMessages = (newErrorMessages: string[]) => {
    // Don't change error messages from [] to [], cause that would trigger an unnecessary rerender
    if (errorMessages.length > 0 || newErrorMessages.length > 0) {
      setErrorMessages(newErrorMessages);
    }
    setSuccessMessage("");
  };

  const changeSuccessMessage = (newSuccessMessage: string) => {
    setSuccessMessage(newSuccessMessage);
    if (errorMessages.length > 0) setErrorMessages([]);
  };

  const resetMessages = () => {
    if (errorMessages.length > 0) setErrorMessages([]);
    setSuccessMessage("");
  };

  return (
    <body
      data-bs-theme={theme}
      className={`cc-${theme}-layout min-vh-100 d-flex flex-column`}
      style={{ overflowX: "hidden" }}
    >
      <MainContext.Provider
        value={{
          theme,
          setTheme: changeTheme,
          errorMessages,
          changeErrorMessages,
          successMessage,
          changeSuccessMessage,
          resetMessages,
        }}
      >
        <Navbar initSession={initSession} />
        <main className="container-md d-flex flex-column pt-4 px-0 pb-2 flex-grow-1">
          {children}
        </main>
        <Footer />
      </MainContext.Provider>
    </body>
  );
};

export default MainLayout;
