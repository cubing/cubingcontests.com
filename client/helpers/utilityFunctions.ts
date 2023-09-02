import jwtDecode from 'jwt-decode';
import { format, isSameDay, isSameMonth, isSameYear } from 'date-fns';
import Countries from '@sh/Countries';
import { EventFormat, Role, RoundFormat } from '@sh/enums';
import C from '@sh/constants';
import { getRoundCanHaveAverage } from '@sh/sharedFunctions';
import { ICompetition, IEvent, IPerson, IResult } from '@sh/interfaces';
import { roundFormatOptions } from './multipleChoiceOptions';
import { MultiChoiceOption } from './interfaces/MultiChoiceOption';

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

// Returns null if the time is invalid (e.g. 81.45); returns 0 if it's empty
export const getResult = (time: string, eventFormat: EventFormat): number | null => {
  if (time.length > 7) throw new Error('getResult does not support times >= 10 hours long');
  else if (time === '') return 0;

  if (eventFormat === EventFormat.Number) return parseInt(time);

  let hours = 0;
  let minutes = 0;
  let centiseconds: number;

  if (time.length === 7) hours = parseInt(time[0]);

  if (time.length > 4) {
    minutes = parseInt(time.slice(time.length === 7 ? 1 : 0, -4));
    centiseconds = parseInt(time.slice(-4));
  } else {
    centiseconds = parseInt(time);
  }

  if (minutes >= 60 || centiseconds >= 6000) return null;

  return hours * 360000 + minutes * 6000 + centiseconds;
};

// Returns the best and average times
export const getBestAndAverage = (
  attempts: number[],
  roundFormat: RoundFormat,
  event: IEvent,
): { best: number; average: number } => {
  let best: number, average: number;
  let sum = 0;
  let DNFDNScount = 0;

  // This actually follows the rule that the lower the attempt value is - the better
  const convertedAttempts = attempts.map((attempt) => {
    if (attempt > 0) {
      sum += attempt;
      return attempt;
    }

    DNFDNScount++;
    return Infinity;
  });

  best = Math.min(...convertedAttempts);
  if (best === Infinity) best = -1; // if infinity, that means every attempt was DNF/DNS

  if (
    // No averages for rounds that don't support them
    !getRoundCanHaveAverage(roundFormat, event) ||
    DNFDNScount > 1 ||
    (DNFDNScount > 0 && attempts.length === 3)
  ) {
    average = -1;
  } else {
    // Subtract best and worst results, if it's an Ao5 round
    if (attempts.length === 5) {
      sum -= best;
      if (DNFDNScount === 0) sum -= Math.max(...attempts);
    }

    average = Math.round((sum / 3) * (event.format === EventFormat.Number ? 100 : 1));
  }

  return { best, average };
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
      if (noFormatting) output += '00';
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
// passing it the result with the best single and average set
export const checkErrorsBeforeSubmit = (
  result: IResult,
  roundFormat: RoundFormat,
  event: IEvent,
  persons: IPerson[],
  setErrorMessages: (val: string[]) => void,
  setSuccessMessage: (val: string) => void,
  callback: (result: IResult) => void,
  requireRealResult = false,
) => {
  const errorMessages: string[] = [];

  if (persons.includes(null)) {
    errorMessages.push('Invalid person(s)');
  } else if (persons.some((p1, i1) => persons.some((p2, i2) => i1 !== i2 && p1.personId === p2.personId))) {
    errorMessages.push('You cannot enter the same person twice');
  }

  let realResultExists = false; // real meaning not DNF or DNS

  for (let i = 0; i < result.attempts.length; i++) {
    if (result.attempts[i] === null) errorMessages.push(`Attempt ${i + 1} is invalid`);
    else if (result.attempts[i] === 0) errorMessages.push(`Please enter attempt ${i + 1}`);
    else if (result.attempts[i] > 0) realResultExists = true;
  }

  if (requireRealResult && !realResultExists) errorMessages.push('You cannot submit only DNF/DNS results');

  if (errorMessages.length > 0) {
    setErrorMessages(errorMessages);
  } else {
    setErrorMessages([]);
    setSuccessMessage('');

    const { best, average } = getBestAndAverage(result.attempts, roundFormat, event);
    result.best = best;
    result.average = average;

    callback(result);
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

// Disallows Mo3 format for events that have Ao5 as the default format, and vice versa for all other events
export const getAllowedRoundFormats = (event: IEvent): MultiChoiceOption[] => {
  if (event.defaultRoundFormat === RoundFormat.Average) {
    return roundFormatOptions.filter((el) => el.value !== RoundFormat.Mean);
  } else {
    return roundFormatOptions.filter((el) => el.value !== RoundFormat.Average);
  }
};
