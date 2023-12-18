import C from '@sh/constants';
import { ContestType, EventFormat, EventGroup, RoundFormat, WcaRecordType } from './enums';
import { IResult, IRecordPair, IEvent } from './interfaces';
import { roundFormats } from './roundFormats';

// Returns >0 if a is worse than b, <0 if a is better than b, and 0 if it's a tie.
// This means that this function (and the one below) can be used in the Array.sort() method.
export const compareSingles = (a: IResult, b: IResult): number => {
  if (a.best <= 0 && b.best > 0) return 1;
  else if (a.best > 0 && b.best <= 0) return -1;
  else if (a.best <= 0 && b.best <= 0) return 0;
  return a.best - b.best;
};

// Same logic as above, except the single is also used as a tie-breaker if both averages are DNF.
// This tie-breaking behavior can be disabled with noTieBreaker = true (e.g. when setting records).
// However, that third argument cannot be used with the Array.sort() method.
export const compareAvgs = (a: IResult, b: IResult, noTieBreaker = false): number => {
  if (a.average <= 0) {
    if (b.average <= 0) {
      if (noTieBreaker) return 0;
      return compareSingles(a, b);
    }
    return 1;
  } else if (a.average > 0 && b.average <= 0) {
    return -1;
  }

  if (a.average === b.average && !noTieBreaker) return compareSingles(a, b);

  return a.average - b.average;
};

// IMPORTANT: it is assumed that recordPairs is sorted by importance (i.e. first WR, then the CRs, then NR, then PR)
export const setResultRecords = (
  result: IResult,
  event: IEvent,
  recordPairs: IRecordPair[],
  noConsoleLog = false,
): IResult => {
  for (const recordPair of recordPairs) {
    // TO-DO: REMOVE HARD CODING TO WR!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    if (recordPair.wcaEquivalent === WcaRecordType.WR) {
      const comparisonToRecordSingle = compareSingles(result, { best: recordPair.best } as IResult);

      if (result.best > 0 && comparisonToRecordSingle <= 0) {
        if (!noConsoleLog) console.log(`New ${result.eventId} single WR: ${result.best}`);
        result.regionalSingleRecord = recordPair.wcaEquivalent;
      }

      if (result.attempts.length === roundFormats.find((rf) => rf.value === event.defaultRoundFormat).attempts) {
        const comparisonToRecordAvg = compareAvgs(result, { average: recordPair.average } as IResult, true);

        if (result.average > 0 && comparisonToRecordAvg <= 0) {
          if (!noConsoleLog) console.log(`New ${result.eventId} average WR: ${result.average}`);
          result.regionalAverageRecord = recordPair.wcaEquivalent;
        }
      }
    }
  }

  return result;
};

export const getDateOnly = (date: Date): Date => {
  if (!date) {
    console.error(`The date passed to getDateOnly is invalid: ${date}`);
    return null;
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
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

export const getRoundRanksWithAverage = (roundFormat: RoundFormat): boolean =>
  [RoundFormat.Average, RoundFormat.Mean].includes(roundFormat);

export const getDefaultAverageAttempts = (event: IEvent) =>
  roundFormats.find((rf) => rf.value === event.defaultRoundFormat).attempts === 5 ? 5 : 3;

export const getAlwaysShowDecimals = (event: IEvent): boolean =>
  event.groups.includes(EventGroup.ExtremeBLD) && event.format !== EventFormat.Multi;

export const getIsCompType = (contestType: ContestType): boolean =>
  [ContestType.WcaComp, ContestType.Competition].includes(contestType);
