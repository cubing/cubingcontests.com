import Countries from '@sh/Countries';
import ICompetition from '~/shared_helpers/interfaces/Competition';

export const getCountry = (competition: ICompetition): string => {
  return Countries.find((el) => el.code === competition.countryId)?.name || 'Unknown country';
};
