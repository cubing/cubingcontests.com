import Countries from '@sh/Countries';
import { IEvent, IPerson, IRound } from '@sh/interfaces';
import myFetch from './myFetch';
import { roundFormats } from './roundFormats';

export const getCountry = (countryId: string): string => {
  return Countries.find((el) => el.code === countryId)?.name || 'Unknown country';
};

export const getFormattedDate = (startDate: Date | string, endDate?: Date | string): string => {
  if (!startDate) throw new Error('Start date missing!');

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (typeof startDate === 'string') startDate = new Date(startDate);
  if (typeof endDate === 'string') endDate = new Date(endDate);

  if (!endDate || startDate.getTime() === endDate.getTime()) {
    return `${months[startDate.getMonth()]} ${startDate.getDate()}, ${startDate.getFullYear()}`;
  } else {
    return 'Not implemented';
  }
};

export const getRoundCanHaveAverage = (round: IRound, events: IEvent[]): boolean => {
  // Multi-Blind rounds cannot have an average
  if (round.eventId === '333mbf') return false;

  // Bo1 and Bo2 rounds cannot have an average
  const numberOfSolves = roundFormats[round.format].attempts;
  if (numberOfSolves < 3) return false;

  // If the round has a different number of attempts from the default event format, the round cannot have an average
  const event = events.find((el) => el.eventId === round.eventId);
  if (numberOfSolves !== roundFormats[event.defaultRoundFormat].attempts) return false;

  return true;
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
