"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import Navbar from "~/app/components/UI/Navbar.tsx";
import Footer from "~/app/components/UI/Footer.tsx";
import { MainContext, Theme } from "~/helpers/contexts.ts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      retry: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const [theme, setTheme] = useState<Theme>("dark");
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [loadingId, setLoadingId] = useState("");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");

    if (storedTheme) {
      setTheme(storedTheme as Theme);
    } else {
      localStorage.setItem("theme", "dark");
    }
  }, []);

  useEffect(() => {
    resetMessagesAndLoadingId();
  }, [pathname]);

  const changeTheme = (newTheme: Theme) => {
    if (newTheme !== theme) {
      setTheme(newTheme);
      localStorage.setItem("theme", newTheme);
    }
  };

  const changeErrorMessages = (newErrorMessages: string[]) => {
    // Don't change error messages from [] to [], cause that would trigger an unnecessary rerender
    if (errorMessages.length > 0 || newErrorMessages.length > 0) setErrorMessages(newErrorMessages);
    setSuccessMessage("");
    setLoadingId("");
  };

  const changeSuccessMessage = (newSuccessMessage: string) => {
    setSuccessMessage(newSuccessMessage);
    if (errorMessages.length > 0) setErrorMessages([]);
    setLoadingId("");
  };

  const changeLoadingId = (newLoadingId: string) => {
    setLoadingId(newLoadingId);
    if (errorMessages.length > 0) setErrorMessages([]);
    setSuccessMessage("");
  };

  const resetMessagesAndLoadingId = () => {
    if (errorMessages.length > 0) setErrorMessages([]);
    setSuccessMessage("");
    setLoadingId("");
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
      <QueryClientProvider client={queryClient}>
        <MainContext.Provider
          value={{
            queryClient,
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
          <Navbar />
          <main className="container-md d-flex flex-column pt-4 px-0 pb-2 flex-grow-1">{children}</main>
          <Footer />
        </MainContext.Provider>
      </QueryClientProvider>
    </body>
  );
};

export default MainLayout;
