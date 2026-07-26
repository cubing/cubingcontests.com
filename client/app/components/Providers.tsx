"use client";

import { usePathname } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense, useEffect, useState } from "react";
import { SWRConfig } from "swr";
import Footer from "~/app/components/UI/Footer.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import Navbar from "~/app/components/UI/Navbar.tsx";
import { MainContext } from "~/helpers/contexts.ts";
import type { Theme } from "~/helpers/types.ts";
import { getActionError } from "~/helpers/utility-functions.ts";

type Props = {
  children: React.ReactNode;
};

function Providers({ children }: Props) {
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
    if (errorMessages.length > 0 || newErrorMessages.length > 0) setErrorMessages(newErrorMessages);
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
    <body data-bs-theme={theme} className="min-vh-100 d-flex flex-column" style={{ overflowX: "hidden" }}>
      <SWRConfig
        value={{
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
          shouldRetryOnError: false,
          onSuccess: (res) => {
            if (res.serverError || res.validationErrors) changeErrorMessages([getActionError(res)]);
          },
        }}
      >
        <NuqsAdapter>
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
            <Suspense fallback={<Loading />}>
              <Navbar />
              <main className="container-md d-flex flex-column flex-grow-1 px-0 pt-4 pb-2">{children}</main>
              <Footer />
            </Suspense>
          </MainContext.Provider>
        </NuqsAdapter>
      </SWRConfig>
    </body>
  );
}

export default Providers;
