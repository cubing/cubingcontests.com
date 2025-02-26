export type FetchSuccess<T> = {
  success: true;
  data: T;
};

export type FetchErrorObj<T = any> = {
  code: string;
  message?: string;
  data?: T;
};

export type FetchError<T> = {
  success: false;
  error: FetchErrorObj<T>;
};

export type FetchObj<T = any> = FetchSuccess<T> | FetchError<T>;
