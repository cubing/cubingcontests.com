import { createContext } from 'react';

export type Theme = 'dark' | 'light';

export interface IMainContext {
  theme: Theme;
  setTheme: (value: Theme) => void;
  errorMessages: string[];
  setErrorMessages: (value: string[]) => void;
  successMessage: string;
  setSuccessMessage: (value: string) => void;
  loadingId: string;
  setLoadingId: (value: string) => void;
  resetMessagesAndLoadingId: () => void;
}

export const MainContext = createContext<IMainContext>({
  theme: 'dark',
  setTheme: () => {},
  errorMessages: [],
  setErrorMessages: () => {},
  successMessage: '',
  setSuccessMessage: () => {},
  loadingId: '',
  setLoadingId: () => {},
  resetMessagesAndLoadingId: () => {},
});
