import { createContext } from 'react';

export type Theme = 'dark' | 'light';

export interface IMainContext {
  theme: Theme;
  setTheme: (value: Theme) => void;
}

export const MainContext = createContext<IMainContext>({
  theme: 'dark',
  setTheme: () => {},
});
