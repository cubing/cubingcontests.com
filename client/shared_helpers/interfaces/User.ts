import { Role } from '@sh/enums';
import { IPerson } from '@sh/types';

export interface IFeUser {
  username: string;
  email: string;
  roles?: Role[];
  person?: IPerson;
}
