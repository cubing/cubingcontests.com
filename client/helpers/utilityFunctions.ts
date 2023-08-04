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

const getResult = (time: string, event: IEvent): number => {
  // If FMC or negative value, return as is, just converted to integer
  if (event.eventId === '333fm' || time.includes('-')) return parseInt(time);

  time = time.replace(':', '').replace('.', '');

  let minutes = 0;
  if (time.length > 4) {
    minutes = parseInt(time.slice(0, -4));
    time = time.slice(-4);
  }

  const centiseconds = parseInt(time) + minutes * 6000;
  return centiseconds;
};

// Returns the best result, the average and the parsed attempts
export const getBestAverageAndAttempts = (
  attempts: string[],
  round: IRound,
  event: IEvent,
): [number, number, number[]] => {
  const parsedAttempts = attempts.map((el) => (el.trim() ? getResult(el, event) : -2));
  let best: number, average: number;

  // If the attempt is 0, -1 or -2, then it's a special value that is always worse than other values (e.g. DNF/DNS)
  best = Math.min(...parsedAttempts.map((att) => (att > 0 ? att : Infinity)));
  if (best === Infinity) best = -1; // if infinity, that means every attempt was DNF/DNS

  if (
    // No averages for rounds that don't support them
    !getRoundCanHaveAverage(round, event) ||
    // DNF average if there are multiple DNF/DNS results
    parsedAttempts.filter((el) => el <= 0).length > 1 ||
    // DNF average if there is a DNF/DNS in a Mo3
    (parsedAttempts.filter((el) => el <= 0).length > 0 && parsedAttempts.length === 3)
  ) {
    average = -1;
  } else {
    let sum = parsedAttempts.reduce((prev: number, curr: number) => {
      // Ignore DNF, DNS, etc.
      if (curr <= 0) return prev;
      return curr + prev;
    }) as number;

    // Subtract best and worst results
    if (parsedAttempts.length === 5) {
      sum -= best;
      // Only subtract worst if there is no DNF, DNS, etc.
      if (parsedAttempts.find((el) => el <= 0) === undefined) sum -= Math.max(...parsedAttempts);
    }

    average = Math.round((sum / 3) * (event.eventId === '333fm' ? 100 : 1));
  }

  return [best, average, parsedAttempts];
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

export const formatTime = (time: number, event: IEvent, isAverage = false): string => {
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
  return attempts.map((el) => formatTime(el, event)).join(' ');
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
