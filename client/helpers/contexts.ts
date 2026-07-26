import { createContext } from "react";
import type { Theme } from "~/helpers/types.ts";

interface MainContext {
  theme: Theme;
  setTheme: (value: Theme) => void;
  errorMessages: string[];
  changeErrorMessages: (value: string[]) => void;
  successMessage: string;
  changeSuccessMessage: (value: string) => void;
  resetMessages: () => void;
}

export const MainContext = createContext<MainContext>({
  theme: "dark",
  setTheme: () => {},
  errorMessages: [],
  changeErrorMessages: () => {},
  successMessage: "",
  changeSuccessMessage: () => {},
  resetMessages: () => {},
});
