import jwtDecode from 'jwt-decode';
import { isSameDay, isSameMonth, isSameYear } from 'date-fns';
import { format } from 'date-fns-tz';
import myFetch from './myFetch';
import { Color, ContestType, EventFormat, Role } from '@sh/enums';
import C from '@sh/constants';
import { getAlwaysShowDecimals } from '@sh/sharedFunctions';
import { IAttempt, IContest, IEvent, IPerson, IResult } from '@sh/interfaces';
import { IUserInfo } from './interfaces/UserInfo';

export const getFormattedCoords = (comp: IContest): string => {
  return `${(comp.latitudeMicrodegrees / 1000000).toFixed(6)}, ${(comp.longitudeMicrodegrees / 1000000).toFixed(6)}`;
};

export const getFormattedDate = (startDate: Date | string, endDate?: Date | string, timeZone = 'UTC'): string => {
  if (!startDate) throw new Error('Start date missing!');

  if (typeof startDate === 'string') startDate = new Date(startDate);
  if (typeof endDate === 'string') endDate = new Date(endDate);

  const fullFormat = 'd MMM yyyy';

  if (!endDate || isSameDay(startDate, endDate)) {
    return format(startDate, fullFormat, { timeZone });
  } else {
    let startFormat: string;

    if (!isSameYear(startDate, endDate)) startFormat = fullFormat;
    else if (!isSameMonth(startDate, endDate)) startFormat = 'd MMM';
    else startFormat = 'd';

    return `${format(startDate, startFormat, { timeZone })} - ${format(endDate, fullFormat, { timeZone })}`;
  }
};

export const getFormattedTime = (
  time: number,
  {
    event,
    noFormatting = false,
    showMultiPoints = false,
    showDecimals = true,
    alwaysShowMinutes = false,
  }: {
    event?: IEvent;
    noFormatting?: boolean;
    showMultiPoints?: boolean;
    showDecimals?: boolean; // if the time is >= 1 hour, they won't be shown regardless of this value
    alwaysShowMinutes?: boolean;
  } = {
    noFormatting: false,
    showMultiPoints: false,
    showDecimals: true,
    alwaysShowMinutes: false,
  },
): string => {
  if (time === -1) {
    return 'DNF';
  } else if (time === -2) {
    return 'DNS';
  } else if (time === C.maxTime) {
    return 'Unknown';
  } else if (event?.format === EventFormat.Number) {
    // FMC singles are limited to 99 moves, so if it's more than that, it must be the mean. Format it accordingly.
    if (time >= 100 && !noFormatting) return (time / 100).toFixed(2);
    else return time.toString();
  } else {
    let centiseconds: number;
    let timeStr = time.toString();

    if (event?.format !== EventFormat.Multi) centiseconds = time;
    else centiseconds = parseInt(timeStr.slice(timeStr.length - 11, -4));

    let output = '';
    const hours = Math.floor(centiseconds / 360000);
    const minutes = Math.floor(centiseconds / 6000) % 60;
    const seconds = (centiseconds - hours * 360000 - minutes * 6000) / 100;

    if (hours > 0) {
      output = hours.toString();
      if (!noFormatting) output += ':';
    }

    const showMinutes = hours > 0 || minutes > 0 || alwaysShowMinutes;

    if (showMinutes) {
      if (hours > 0 && minutes === 0) output += '00';
      else if (minutes < 10 && hours > 0) output += '0' + minutes;
      else output += minutes;

      if (!noFormatting) output += ':';
    }

    if (seconds < 10 && showMinutes) output += '0';

    // Only times under ten minutes can have decimals, or if noFormatting = true, or if it's an event that always
    // includes the decimals (but the time is still < 1 hour). If showDecimals = false, the decimals aren't shown.
    if (
      ((hours === 0 && minutes < 10) || noFormatting || (event && getAlwaysShowDecimals(event) && time < 360000)) &&
      showDecimals
    ) {
      output += seconds.toFixed(2);
      if (noFormatting) output = Number(output.replace('.', '')).toString();
    } else {
      output += Math.floor(seconds).toFixed(0); // remove the decimals
    }

    if (event?.format !== EventFormat.Multi) {
      return output;
    } else {
      if (time < 0) timeStr = timeStr.replace('-', '');

      const points = (time < 0 ? -1 : 1) * (9999 - parseInt(timeStr.slice(0, -11)));
      const missed = parseInt(timeStr.slice(timeStr.length - 4));
      const solved = points + missed;

      if (time > 0) {
        if (noFormatting) return `${solved};${solved + missed};${output}`;
        // This includes an En space before the points part
        return (
          `${solved}/${solved + missed} ${centiseconds !== C.maxTime ? output : 'Unknown time'}` +
          (showMultiPoints ? ` (${points})` : '')
        );
      } else {
        if (noFormatting) return `${solved};${solved + missed};${output}`;
        return `DNF (${solved}/${solved + missed} ${output})`;
      }
    }
  }
};

// Returns null if the time is invalid
export const getCentiseconds = (
  time: string, // the time string without formatting (e.g. 1:35.97 should be "13597")
  { round = true, throwErrorWhenInvalidTime = false }: { round?: boolean; throwErrorWhenInvalidTime?: boolean } = {
    round: true,
    throwErrorWhenInvalidTime: false,
  },
): number | null => {
  let hours = 0;
  let minutes = 0;
  let centiseconds: number;

  if (time.length >= 5) {
    // Round attempts >= 10 minutes long, unless noRounding = true
    if (time.length >= 6 && round) time = time.slice(0, -2) + '00';

    if (time.length >= 7) hours = parseInt(time.slice(0, time.length - 6));
    minutes = parseInt(time.slice(Math.max(time.length - 6, 0), -4));
    centiseconds = parseInt(time.slice(-4));
  } else {
    centiseconds = parseInt(time);
  }

  // Disallow >60 minutes, >60 seconds, and times more than 24 hours long
  if (minutes >= 60 || centiseconds >= 6000 || hours > 24 || (hours === 24 && minutes > 0 && centiseconds > 0)) {
    if (throwErrorWhenInvalidTime)
      throw new Error(
        `Invalid time: ${time}. Debug info: hours = ${hours}, minutes = ${minutes}, centiseconds = ${centiseconds}, time = ${time}, round = ${round}`,
      );
    return null;
  }

  return hours * 360000 + minutes * 6000 + centiseconds;
};

// Returns null if the time is invalid (e.g. 8145); returns 0 if it's empty.
// solved and attempted are only required for the Multi event format.
export const getAttempt = (
  attempt: IAttempt,
  event: IEvent,
  time: string, // a time string without formatting (e.g. 1534 represents 15.34, 25342 represents 2:53.42)
  {
    roundTime = false,
    roundMemo = false,
    solved,
    attempted,
    memo,
  }: {
    roundTime?: boolean;
    roundMemo?: boolean;
    // These three parameters are optional if the event format is Number
    solved?: number | null | undefined;
    attempted?: number | null | undefined;
    memo?: string | undefined; // only used for events with the event group HasMemo
  } = {
    roundTime: false,
    roundMemo: false,
  },
): IAttempt => {
  if (time.length > 8 || memo?.length > 8) throw new Error('times longer than 8 digits are not supported');
  if (time.length > 2 && event.format === EventFormat.Number)
    throw new Error('Fewest Moves solutions longer than 2 digits are not supported');

  if (event.format === EventFormat.Number) return { ...attempt, result: time ? parseInt(time) : 0 };

  const newAttempt: IAttempt = { result: time ? getCentiseconds(time, { round: roundTime }) : 0 };
  if (memo !== undefined) {
    newAttempt.memo = getCentiseconds(memo, { round: roundMemo });
    if (newAttempt.memo >= newAttempt.result) return { ...newAttempt, result: null };
  }

  if (event.format === EventFormat.Multi && newAttempt.result) {
    if ([null, undefined].includes(solved) || [null, undefined].includes(attempted) || solved > attempted)
      return { result: null };

    const maxTime = Math.min(attempted, 6) * 60000 + attempted * 200; // accounts for +2s

    // Disallow submitting multi times > max time, and <= 1 hour for old style
    if (event.eventId === '333mbf' && newAttempt.result > maxTime) return { ...newAttempt, result: null };
    else if (event.eventId === '333mbo' && newAttempt.result <= 360000) return { ...newAttempt, result: null };

    // See the IResult interface for information about how this works
    let multiOutput = ''; // DDDDTTTTTTTMMMM
    const missed: number = attempted - solved;
    let points: number = solved - missed;

    if (points <= 0) {
      if (points < 0 || solved < 2) multiOutput += '-';
      points = -points;
    }

    multiOutput += 9999 - points;
    multiOutput += new Array(7 - newAttempt.result.toString().length).fill('0').join('') + newAttempt.result;
    multiOutput += new Array(4 - missed.toString().length).fill('0').join('') + missed;

    newAttempt.result = parseInt(multiOutput);
  }

  return newAttempt;
};

// Returns the best and average times
export const getBestAndAverage = (attempts: IAttempt[], event: IEvent): { best: number; average: number } => {
  let best: number, average: number;
  let sum = 0;
  let DNFDNScount = 0;

  // This actually follows the rule that the lower the attempt value is - the better
  const convertedAttempts = attempts.map(({ result }) => {
    if (result > 0) {
      sum += result;
      return result;
    }
    DNFDNScount++;
    return Infinity;
  });

  best = Math.min(...convertedAttempts);
  if (best === Infinity) best = -1; // if infinity, that means every attempt was DNF/DNS

  if (attempts.length < 3 || DNFDNScount > 1 || (DNFDNScount > 0 && attempts.length === 3)) {
    average = -1;
  } else {
    // Subtract best and worst results, if it's an Ao5 round
    if (attempts.length === 5) {
      sum -= best;
      if (DNFDNScount === 0) sum -= Math.max(...convertedAttempts);
    }

    average = Math.round((sum / 3) * (event.format === EventFormat.Number ? 100 : 1));
  }

  return { best, average };
};

// Returns the authenticated user's info
export const getUserInfo = (): IUserInfo => {
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('jwtToken');

    if (token) {
      // Decode the JWT (only take the part after "Bearer ")
      const authorizedUser: any = jwtDecode(token.split(' ')[1]);

      const userInfo: IUserInfo = {
        username: authorizedUser.username,
        roles: authorizedUser.roles,
        isAdmin: authorizedUser.roles.includes(Role.Admin),
        isMod: authorizedUser.roles.includes(Role.Moderator),
      };

      return userInfo;
    }
  }
};

// Checks if there are any errors, and if not, calls the callback function,
// passing it the result with the best single and average set
export const checkErrorsBeforeResultSubmission = (
  result: IResult,
  event: IEvent,
  persons: IPerson[],
  setErrorMessages: (val: string[]) => void,
  setSuccessMessage: (val: string) => void,
  callback: (result: IResult) => void,
) => {
  const errorMessages: string[] = [];

  if (persons.includes(null)) {
    errorMessages.push('Invalid person(s)');
  } else if (persons.some((p1, i1) => persons.some((p2, i2) => i1 !== i2 && p1.personId === p2.personId))) {
    errorMessages.push('You cannot enter the same person twice');
  }

  for (let i = 0; i < result.attempts.length; i++) {
    if (result.attempts[i].result === null || result.attempts[i].memo === null)
      errorMessages.push(`Attempt ${i + 1} is invalid`);
    else if (result.attempts[i].result === 0) errorMessages.push(`Please enter attempt ${i + 1}`);
  }

  if (errorMessages.length > 0) {
    setErrorMessages(errorMessages);
  } else {
    setErrorMessages([]);
    setSuccessMessage('');

    const { best, average } = getBestAndAverage(result.attempts, event);
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

export const getBSClassFromColor = (color: Color): string => {
  // THE MAGENTA OPTION IS SKIPPED FOR NOW
  switch (color) {
    case Color.Red: {
      return 'danger';
    }
    case Color.Blue: {
      return 'primary';
    }
    case Color.Green: {
      return 'success';
    }
    case Color.Yellow: {
      return 'warning';
    }
    case Color.White: {
      return 'light';
    }
    case Color.Cyan: {
      return 'info';
    }
    case Color.Black: {
      return 'dark';
    }
    default: {
      console.error(`Unknown color: ${color}`);
      return 'dark';
    }
  }
};

export const getContestIdFromName = (name: string): string => {
  let output = name.replaceAll(/[^a-zA-Z0-9 ]/g, '');
  const parts = output.split(' ');

  output = parts
    .filter((el) => el !== '')
    .map((el) => el[0].toUpperCase() + el.slice(1))
    .join('');

  return output;
};

export const genericOnKeyDown = (
  e: any,
  {
    nextFocusTargetId,
    onKeyDown,
    submitOnEnter,
  }: { nextFocusTargetId?: string; onKeyDown?: (e: any) => void; submitOnEnter?: boolean },
) => {
  if (e.key === 'Enter') {
    if (!submitOnEnter) e.preventDefault();
    if (nextFocusTargetId) document.getElementById(nextFocusTargetId)?.focus();
  }

  if (onKeyDown) onKeyDown(e);
};

export const splitNameAndLocalizedName = (value: string): [string, string | undefined] => {
  const stringParts = value.split(' (');
  const name = stringParts[0];
  const localizedName = stringParts.length > 1 ? stringParts[1].slice(0, -1) : undefined;

  return [name, localizedName];
};

export const shortenEventName = (name: string): string => {
  return name
    .replaceAll('2x2x2', '2x2')
    .replaceAll('3x3x3', '3x3')
    .replaceAll('4x4x4', '4x4')
    .replaceAll('5x5x5', '5x5')
    .replaceAll('6x6x6', '6x6')
    .replaceAll('7x7x7', '7x7')
    .replaceAll('8x8x8', '8x8')
    .replaceAll('9x9x9', '9x9')
    .replaceAll('10x10x10', '10x10')
    .replaceAll('11x11x11', '11x11')
    .replace('Blindfolded', 'BLD')
    .replace('Multi-Blind', 'MBLD')
    .replace('One-Handed', 'OH')
    .replace('Face-turning Octahedron', 'FTO')
    .replace(' Cuboid', '')
    .replace(' Challenge', '');
};

export const getWcaCompetitionDetails = async (competitionId: string): Promise<IContest> => {
  const { payload: wcaCompData, errors: e1 } = await myFetch.get(`${C.wcaApiBase}/competitions/${competitionId}.json`);

  if (e1) throw new Error(e1[0]);

  // This is for getting the competitor limit, organizer WCA IDs, and delegate WCA IDs
  const { payload: wcaV0CompData, errors: e2 } = await myFetch.get(
    `https://www.worldcubeassociation.org/api/v0/competitions/${competitionId}`,
  );

  // Sometimes the competitor limit does not exist
  const competitorLimit = wcaV0CompData.competitor_limit || 10;
  const startDate = new Date(wcaCompData.date.from);
  const endDate = new Date(wcaCompData.date.till);

  const newContest: IContest = {
    competitionId,
    name: wcaCompData.name,
    type: ContestType.WcaComp,
    city: wcaCompData.city,
    countryIso2: wcaCompData.country,
    // Gets rid of the link and just takes the venue name
    venue: wcaCompData.venue.name.split(']')[0].replace('[', ''),
    address: wcaCompData.venue.address,
    latitudeMicrodegrees: Math.round(wcaCompData.venue.coordinates.latitude * 1000000),
    longitudeMicrodegrees: Math.round(wcaCompData.venue.coordinates.longitude * 1000000),
    startDate,
    endDate,
    organizers: [], // this is set below
    description: `Unofficial events from ${wcaCompData.name}. For official events see the official [WCA competition page](https://worldcubeassociation.org/competitions/${competitionId}).`,
    competitorLimit,
    events: [],
    // compDetails.schedule needs to be set by an admin manually
  };

  if (e2) throw new Error(e2[0]);

  const notFoundPersonNames: string[] = [];

  // Set organizer objects
  for (const org of [...wcaV0CompData.organizers, ...wcaV0CompData.delegates]) {
    let name = org.name;
    if (org.wca_id) name += '|' + org.wca_id;
    const person = await fetchPerson(name);

    if (person !== null) {
      if (!newContest.organizers.some((el) => el.personId === person.personId)) newContest.organizers.push(person);
    } else if (!notFoundPersonNames.includes(org.name)) {
      notFoundPersonNames.push(org.name);
    }
  }

  if (notFoundPersonNames.length > 0)
    throw new Error(`Organizers with these names were not found: ${notFoundPersonNames.join(', ')}`);

  return newContest;
};

// null means person not found
export const fetchPerson = async (name: string): Promise<IPerson | null> => {
  const newPerson: IPerson = { personId: 0, name: '', wcaId: '', countryIso2: '', createdBy: '' };
  // If the WCA ID is available, use that
  const parts = name.split('|');

  if (parts[1]) {
    // Create new person using WCA person info
    const { payload: wcaPerson, errors } = await myFetch.get(`${C.wcaApiBase}/persons/${parts[1]}.json`);

    if (errors) {
      throw new Error(errors[0]);
    } else if (wcaPerson) {
      const [name, localizedName] = splitNameAndLocalizedName(wcaPerson.name);

      newPerson.name = name;
      newPerson.localizedName = localizedName;
      newPerson.wcaId = parts[1];
      newPerson.countryIso2 = wcaPerson.country;

      const { payload: person, errors } = await myFetch.post('/persons/create-or-get', newPerson);

      if (errors) {
        throw new Error(errors[0]);
      } else {
        return person;
      }
    }
  }

  // If not, first try looking in the CC database
  const englishNameOnly = name.split('(')[0].trim(); // get rid of the ( and everything after it
  const { payload, errors: e1 } = await myFetch.get(`/persons?searchParam=${englishNameOnly}&exactMatch=true`);

  if (e1) {
    throw new Error(`Error while fetching person with the name ${name}`);
  } else if (payload) {
    return payload;
  }

  // If not found, try searching for exact name matches in the WCA database
  const {
    payload: { result: wcaPersonMatches },
    errors,
  } = await myFetch.get(`https://www.worldcubeassociation.org/api/v0/search/users?q=${name}&persons_table=true`);

  if (errors) {
    throw new Error(errors[0]);
  } else if (wcaPersonMatches.length === 1) {
    // Same code as above in the WCA ID search section
    const [name, localizedName] = splitNameAndLocalizedName(wcaPersonMatches[0].name);

    newPerson.name = name;
    newPerson.localizedName = localizedName;
    newPerson.wcaId = wcaPersonMatches[0].wca_id;
    newPerson.countryIso2 = wcaPersonMatches[0].country_iso2 || wcaPersonMatches[0].country.iso2;

    const { payload: person, errors } = await myFetch.post('/persons/create-or-get', newPerson);

    if (errors) {
      throw new Error(errors[0]);
    } else {
      return person;
    }
  }

  return null;
};
