export type FetchObj<T = any> = {
  payload?: T;
  errors?: string[];
  errorData?: any;
};
