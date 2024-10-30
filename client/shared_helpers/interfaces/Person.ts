import { IFeUser } from "../types.ts";

export type IPerson = {
  name: string;
  localizedName?: string; // name in the local language
  wcaId?: string;
  countryIso2: string;
  personId: number; // integer number that is counted from 1 up
  // User ID of the user who created the person. If it was created by an external device, leave it undefined.
  createdBy?: unknown;
  unapproved?: true;
};

export type IPersonDto = Omit<IPerson, "personId" | "createdBy">;

export type IFePerson = Omit<IPerson, "createdBy"> & {
  creator?: IFeUser | "EXT_DEVICE"; // this is only defined for requests made by admins
};

export type IWcaPersonDto = {
  person: IFePerson;
  isNew: boolean;
};
