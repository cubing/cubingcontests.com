import Countries from '@sh/Countries';
import { ICompetition, IEvent } from '@sh/interfaces';

export const getCountry = (countryId: string): string => {
  return Countries.find((el) => el.code === countryId)?.name || 'Unknown country';
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

export const formatTime = (event: IEvent, time: number, isAverage = false): string => {
  if (time === -1) {
    return 'DNF';
  } else if (time === -2) {
    return 'DNS';
  } else if (event.format === 'number') {
    if (isAverage) return (time / 100).toFixed(2);
    else return time.toString();
  } else {
    let output = '';
    const hours = Math.floor(time / 360000);
    const minutes = Math.floor(time / 6000) % 60;
    const seconds = (time - hours * 360000 - minutes * 6000) / 100;

    if (hours > 0) output = hours + ':';
    if (hours > 0 || minutes > 0) {
      if (minutes === 0) output += '00:';
      else if (minutes < 10 && hours > 0) output += '0' + minutes + ':';
      else output += minutes + ':';
    }
    if (seconds < 10 && (hours > 0 || minutes > 0)) output += '0';
    output += seconds;
    if (!output.includes('.')) output += '.00';
    else if (output.split('.')[1].length === 1) output += '0';

    return output;
  }
};

export const getSolves = (event: IEvent, attempts: number[]): string => {
  // The character in quotes is an em space
  return attempts.map((el) => formatTime(event, el)).join(' ');
};
