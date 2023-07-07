import Countries from '@sh/Countries';
import { ICompetition } from '~/shared_helpers/interfaces';

export const getCountry = (competition: ICompetition): string => {
  return Countries.find((el) => el.code === competition.countryId)?.name || 'Unknown country';
};

export const getFormattedDate = (start: Date, end: Date): string => {
  if (!start || !end) throw new Error('Dates missing!');

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (startDate.toString() === endDate.toString()) {
    return `${months[startDate.getMonth()]} ${startDate.getDate()}, ${startDate.getFullYear()}`;
  } else {
    return 'Not implemented';
  }
};
