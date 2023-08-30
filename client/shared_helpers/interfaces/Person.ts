export interface IPerson {
  personId: number; // integer number that is counted from 1 up
  wcaId?: string;
  name: string;
  localizedName?: string; // name in the local language
  countryIso2: string;
}
