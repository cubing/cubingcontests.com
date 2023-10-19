export interface IDtoPerson {
  name: string;
  localizedName?: string; // name in the local language
  wcaId?: string;
  countryIso2: string;
}

export interface IPerson extends IDtoPerson {
  personId: number; // integer number that is counted from 1 up
  createdBy: unknown; // user ID of the user who created the person
}
