export interface IPerson {
  personId: number; // integer number that is counted from 1 up
  user?: unknown; // reference to the user object, if the competitor has a user
  name: string;
  countryIso2: string;
}
