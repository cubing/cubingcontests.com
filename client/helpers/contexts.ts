import { createContext } from "react";

export type Theme = "dark" | "light";

export interface IMainContext {
  theme: Theme;
  setTheme: (value: Theme) => void;
  errorMessages: string[];
  changeErrorMessages: (value: string[]) => void;
  successMessage: string;
  changeSuccessMessage: (value: string) => void;
  resetMessages: () => void;
}

export const MainContext = createContext<IMainContext>({
  theme: "dark",
  setTheme: () => {},
  errorMessages: [],
  changeErrorMessages: () => {},
  successMessage: "",
  changeSuccessMessage: () => {},
  resetMessages: () => {},
});
