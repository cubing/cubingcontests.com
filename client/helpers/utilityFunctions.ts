import Countries from '@sh/Countries';
import { ICompetition, IEvent, IPerson, IRound } from '@sh/interfaces';
import myFetch from './myFetch';
import { roundFormats } from './roundFormats';
import { RoundFormat } from '~/shared_helpers/enums';
import { format, isSameDay, isSameMonth, isSameYear } from 'date-fns';

export const getCountry = (countryIso2: string): string => {
  return Countries.find((el) => el.code === countryIso2)?.name || 'ERROR';
};

export const getFormattedDate = (startDate: Date | string, endDate?: Date | string): string => {
  if (!startDate) throw new Error('Start date missing!');

  if (typeof startDate === 'string') startDate = new Date(startDate);
  if (typeof endDate === 'string') endDate = new Date(endDate);

  const fullFormat = 'dd MMM yyyy';

  if (!endDate || isSameDay(startDate, endDate)) {
    return format(startDate, fullFormat);
  } else {
    let startFormat: string;

    if (!isSameYear(startDate, endDate)) startFormat = fullFormat;
    else if (!isSameMonth(startDate, endDate)) startFormat = 'dd MMM';
    else startFormat = 'dd';

    return `${format(startDate, startFormat)} - ${format(endDate, fullFormat)}`;
  }
};

// Shows 5 decimals instead of 6
export const getFormattedCoords = (comp: ICompetition): string => {
  return `${(comp.latitudeMicrodegrees / 1000000).toFixed(5)}, ${(comp.longitudeMicrodegrees / 1000000).toFixed(5)}`;
};

export const getRoundCanHaveAverage = (round: IRound, event: IEvent): boolean => {
  // Multi-Blind rounds cannot have an average
  if (event.eventId === '333mbf') return false;

  // Bo1 and Bo2 rounds cannot have an average
  const numberOfSolves = roundFormats[round.format].attempts;
  if (numberOfSolves < 3) return false;

  // If the round has a different number of attempts from the default event format, the round cannot have an average
  if (numberOfSolves !== roundFormats[event.defaultRoundFormat].attempts) return false;

  return true;
};

export const getRoundRanksWithAverage = (round: IRound, event: IEvent): boolean => {
  return getRoundCanHaveAverage(round, event) && [RoundFormat.Average, RoundFormat.Mean].includes(round.format);
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

export const selectPerson = async (
  e: any,
  setErrorMessages: (errorMessages: string[]) => void,
  callback: (person: IPerson) => void,
) => {
  if (e.key === 'Enter') {
    // Prevent form from submitting
    e.preventDefault();

    const nameValue = e.target.value.trim();

    // If an empty string was entered, show error
    if (!nameValue) {
      setErrorMessages(['Name cannot be empty']);
      return;
    }

    const { payload, errors } = await myFetch.get(`/persons?searchParam=${nameValue}`);

    if (errors) {
      setErrorMessages(errors);
    } else if (payload.length === 0) {
      setErrorMessages(['Competitor not found']);
    } else if (payload.length > 1) {
      setErrorMessages(['Multiple competitors found, please enter more characters']);
    } else {
      // Call the callback function if there are no errors
      callback(payload[0]);
    }
  }
};
