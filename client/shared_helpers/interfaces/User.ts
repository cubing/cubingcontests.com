import { Role } from '~/shared_helpers/enums.ts';
import { IPerson } from '~/shared_helpers/types.ts';

export interface IFeUser {
  username: string;
  email: string;
  roles?: Role[];
  person?: IPerson;
}
