type SuccessType<T> = {
  success: true;
  data: T;
};

type ErrorType = {
  success: false;
  errors: string[];
  errorData?: any;
};

export type FetchObj<T = any> = SuccessType<T> | ErrorType;
