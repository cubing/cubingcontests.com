import { IFeUser } from '@sh/types';

export type IPerson = {
  name: string;
  localizedName?: string; // name in the local language
  wcaId?: string;
  countryIso2: string;
  personId: number; // integer number that is counted from 1 up
  createdBy: unknown; // user ID of the user who created the person
};

export type IPersonDto = Omit<IPerson, 'personId' | 'createdBy'>;

export type IFePerson = Omit<IPerson, 'createdBy'> & {
  creator?: IFeUser;
};
