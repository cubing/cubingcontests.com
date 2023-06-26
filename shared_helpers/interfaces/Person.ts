export interface IPerson {
  // Optional, because it's not needed when creating a person
  personId?: number; // integer number that is counted from 1 up
  name: string;
  countryId: string; // 2 letter country code
}

export default IPerson;
