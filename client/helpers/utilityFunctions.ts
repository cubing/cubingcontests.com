import jwtDecode from 'jwt-decode';
import { format, isSameDay, isSameMonth, isSameYear } from 'date-fns';
import Countries from '@sh/Countries';
import { EventFormat, Role, RoundFormat } from '@sh/enums';
import C from '@sh/constants';
import { getRoundCanHaveAverage } from '@sh/sharedFunctions';
import { ICompetition, IEvent, IPerson } from '@sh/interfaces';
import { IResultInfo } from './interfaces/ResultInfo';

export const getCountry = (countryIso2: string): string => {
  return Countries.find((el) => el.code === countryIso2)?.name || 'ERROR';
};

export const getFormattedDate = (startDate: Date | string, endDate?: Date | string): string => {
  if (!startDate) throw new Error('Start date missing!');

  if (typeof startDate === 'string') startDate = new Date(startDate);
  if (typeof endDate === 'string') endDate = new Date(endDate);

  const fullFormat = 'd MMM yyyy';

  if (!endDate || isSameDay(startDate, endDate)) {
    return format(startDate, fullFormat);
  } else {
    let startFormat: string;

    if (!isSameYear(startDate, endDate)) startFormat = fullFormat;
    else if (!isSameMonth(startDate, endDate)) startFormat = 'd MMM';
    else startFormat = 'd';

    return `${format(startDate, startFormat)} - ${format(endDate, fullFormat)}`;
  }
};

// Shows 5 decimals instead of 6
export const getFormattedCoords = (comp: ICompetition): string => {
  return `${(comp.latitudeMicrodegrees / 1000000).toFixed(5)}, ${(comp.longitudeMicrodegrees / 1000000).toFixed(5)}`;
};

const getResult = (time: string, event: IEvent): number => {
  if (time === 'DNF') return -1;
  else if (time === 'DNS') return -2;

  // If the event is Fewest Moves, return as is converted to integer
  if (event.eventId === '333fm') return parseInt(time);

  let minutes = 0;
  if (time.length > 4) {
    minutes = parseInt(time.slice(0, -4));
    time = time.slice(-4);
  }

  const centiseconds = parseInt(time) + minutes * 6000;
  return centiseconds;
};

// Returns the best result, the average and the parsed attempts
export const getBestAverageAndAttempts = (attempts: string[], roundFormat: RoundFormat, event: IEvent): IResultInfo => {
  const parsedAttempts = attempts.map((el) => (el.trim() ? getResult(el, event) : -2));
  let best: number, average: number;

  // If the attempt is 0, -1 or -2, then it's a special value that is always worse than other values (e.g. DNF/DNS)
  best = Math.min(...parsedAttempts.map((att) => (att > 0 ? att : Infinity)));
  if (best === Infinity) best = -1; // if infinity, that means every attempt was DNF/DNS

  if (
    // No averages for rounds that don't support them
    !getRoundCanHaveAverage(roundFormat, event) ||
    // DNF average if there are multiple DNF/DNS results
    parsedAttempts.filter((el) => el <= 0).length > 1 ||
    // DNF average if there is a DNF/DNS in a Mo3
    (parsedAttempts.filter((el) => el <= 0).length > 0 && parsedAttempts.length === 3)
  ) {
    average = -1;
  } else {
    let sum = parsedAttempts.reduce((prev: number, curr: number) => {
      if (prev <= 0) prev = 0; // in case the very first value was DNF/DNS
      if (curr <= 0) return prev; // ignore DNF, DNS, etc.
      return curr + prev;
    }) as number;

    // Subtract best and worst results, if it's an Ao5 round
    if (parsedAttempts.length === 5) {
      sum -= best;
      // Only subtract worst if there is no DNF, DNS, etc.
      if (!parsedAttempts.some((el) => el <= 0)) sum -= Math.max(...parsedAttempts);
    }

    average = Math.round((sum / 3) * (event.eventId === '333fm' ? 100 : 1));
  }

  return { parsedAttempts, best, average };
};

export const formatTime = (
  time: number,
  eventFormat: EventFormat,
  { isAverage = false, noFormatting = false }: { isAverage?: boolean; noFormatting?: boolean } = {
    isAverage: false,
    noFormatting: false,
  },
): string => {
  if (time === -1) {
    return 'DNF';
  } else if (time === -2) {
    return 'DNS';
  } else if (eventFormat === EventFormat.Number) {
    if (isAverage && !noFormatting) return (time / 100).toFixed(2);
    else return time.toString();
  } else {
    let output = '';
    const hours = Math.floor(time / 360000);
    const minutes = Math.floor(time / 6000) % 60;
    const seconds = (time - hours * 360000 - minutes * 6000) / 100;

    if (hours > 0) {
      output = hours.toString();
      if (!noFormatting) output += ':';
    }

    if (hours > 0 || minutes > 0) {
      if (minutes === 0) output += '00';
      else if (minutes < 10 && hours > 0) output += '0' + minutes;
      else output += minutes;

      if (!noFormatting) output += ':';
    }

    if (seconds < 10 && (hours > 0 || minutes > 0)) output += '0';
    // Only times under ten minutes can have decimals
    if (hours === 0 && minutes < 10) {
      output += seconds.toFixed(2);
      if (noFormatting) output = Number(output.replace('.', '')).toString();
    } else {
      output += seconds.toFixed(0);
    }

    return output;
  }
};

// Returns the authorized user's role with the highest privilege
export const getRole = (): Role => {
  let role: Role;
  // Decode the JWT (only take the part after "Bearer ")
  const authorizedUser: any = jwtDecode(localStorage.getItem('jwtToken').split(' ')[1]);

  if (authorizedUser.roles.includes(Role.Admin)) role = Role.Admin;
  else if (authorizedUser.roles.includes(Role.Moderator)) role = Role.Moderator;

  return role;
};

// Checks if there are any errors, and if not, calls the callback function,
// passing it the best single, the average, and the parsed attempts
export const checkErrorsBeforeSubmit = (
  attempts: string[],
  roundFormat: RoundFormat,
  event: IEvent,
  persons: IPerson[],
  setErrorMessages: (val: string[]) => void,
  setSuccessMessage: (val: string) => void,
  callback: (resultInfo: IResultInfo) => void,
  requireRealResult = false,
) => {
  const errorMessages: string[] = [];

  if (persons.includes(null)) {
    errorMessages.push('Invalid person(s)');
  } else if (persons.some((p1, i1) => persons.some((p2, i2) => i1 !== i2 && p1.personId === p2.personId))) {
    errorMessages.push('You cannot enter the same person twice');
  }

  let realResultExists = false; // real meaning not DNF or DNS

  for (let i = 0; i < attempts.length; i++) {
    if (attempts[i] === '') errorMessages.push(`Please enter attempt ${i + 1}`);
    else if (!['DNF', 'DNS'].includes(attempts[i])) realResultExists = true;
  }

  if (requireRealResult && !realResultExists) errorMessages.push('You cannot submit only DNF/DNS results');

  if (errorMessages.length > 0) {
    setErrorMessages(errorMessages);
  } else {
    setErrorMessages([]);
    setSuccessMessage('');
    callback(getBestAverageAndAttempts(attempts, roundFormat, event));
  }
};

export const limitRequests = (
  fetchTimer: NodeJS.Timeout,
  setFetchTimer: (val: NodeJS.Timeout) => void,
  callback: () => void,
) => {
  if (fetchTimer !== null) clearTimeout(fetchTimer);

  setFetchTimer(
    setTimeout(async () => {
      await callback();

      // Resetting this AFTER the callback, so that the fetch request can complete first
      setFetchTimer(null);
    }, C.fetchThrottleTimeout),
  );
};
