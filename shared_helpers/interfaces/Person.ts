export interface IPersonBase {
  name: string;
  countryId: string; // 2 letter country code
}

interface IPerson extends IPersonBase {
  personId: number; // integer number that is counted from 1 up
}

export default IPerson;
