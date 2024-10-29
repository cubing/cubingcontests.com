import { createContext } from "react";
import { QueryClient } from "@tanstack/react-query";

export type Theme = "dark" | "light";

export interface IMainContext {
  queryClient: QueryClient;
  theme: Theme;
  setTheme: (value: Theme) => void;
  errorMessages: string[];
  changeErrorMessages: (value: string[]) => void;
  successMessage: string;
  changeSuccessMessage: (value: string) => void;
  // The ID of the element that triggered the loading (used to display a spinner).
  // Use UPPER_CASE_SNAKE_CASE to indicate what is loading, if it isn't the actual ID of an element.
  loadingId: string;
  changeLoadingId: (value: string) => void;
  resetMessagesAndLoadingId: () => void;
  resetMessages: () => void;
}

export const MainContext = createContext<IMainContext>({
  queryClient: undefined as any,
  theme: "dark",
  setTheme: () => {},
  errorMessages: [],
  changeErrorMessages: () => {},
  successMessage: "",
  changeSuccessMessage: () => {},
  loadingId: "",
  changeLoadingId: () => {},
  resetMessagesAndLoadingId: () => {},
  resetMessages: () => {},
});
