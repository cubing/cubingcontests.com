import { ResultDocument } from "~/src/models/result.model";
import {
  compareAvgs,
  compareSingles,
  getDefaultAverageAttempts,
  getIsProceedableResult,
} from "~/helpers/sharedFunctions";
import {
  Event,
  IActivity,
  IContest,
  IContestEvent,
  IResult,
  IRound,
  IRoundFormat,
  IWcifActivity,
  IWcifCompetition,
  IWcifEvent,
  IWcifRound,
  IWcifSchedule,
} from "~/helpers/types";
import { IUser } from "~/helpers/types";
import { formatInTimeZone } from "date-fns-tz";
import { differenceInDays } from "date-fns";
import { RoundDocument } from "~/src/models/round.model";
import { RoundProceed } from "~/helpers/enums";
import { roundFormats } from "~/helpers/roundFormats";

export const getResultProceeds = (
  result: IResult,
  round: IRound,
  roundFormat: IRoundFormat,
) =>
  getIsProceedableResult(result, roundFormat) &&
  result.ranking <= Math.floor(round.results.length * 0.75) && // extra check for top 75%
  result.ranking <=
    (round.proceed.type === RoundProceed.Number
      ? round.proceed.value
      : Math.floor((round.results.length * round.proceed.value) / 100));

export const setRoundRankings = async (
  round: RoundDocument,
): Promise<ResultDocument[]> => {
  if (round.results.length === 0) return [];

  const roundFormat = roundFormats.find((rf) => rf.value === round.format) as IRoundFormat;
  const sortedResults = round.results.sort(
    roundFormat.isAverage ? compareAvgs : compareSingles,
  );
  let prevResult = sortedResults[0];
  let ranking = 1;

  for (let i = 0; i < sortedResults.length; i++) {
    // If the previous result was not tied with this one, increase ranking
    if (
      i > 0 &&
      ((roundFormat.isAverage &&
        compareAvgs(prevResult, sortedResults[i]) < 0) ||
        (!roundFormat.isAverage &&
          compareSingles(prevResult, sortedResults[i]) < 0))
    ) {
      ranking = i + 1;
    }

    sortedResults[i].ranking = ranking;
    prevResult = sortedResults[i];

    // Set proceeds if it's a non-final round and the result proceeds to the next round
    if (
      round.proceed &&
      getResultProceeds(
        sortedResults[i] as IResult,
        round as IRound,
        roundFormat,
      )
    ) {
      sortedResults[i].proceeds = true;
    } else if (sortedResults[i].proceeds) {
      sortedResults[i].proceeds = undefined;
    }

    await sortedResults[i].save(); // update the result in the DB
  }

  return sortedResults;
};

export const setRankings = async (
  results: ResultDocument[],
  ranksWithAverage: boolean,
): Promise<ResultDocument[]> => {
  if (results.length === 0) return [];

  let prevResult = results[0];
  let ranking = 1;

  for (let i = 0; i < results.length; i++) {
    // If the previous result was not tied with this one, increase ranking
    if (
      i > 0 &&
      ((ranksWithAverage &&
        compareAvgs({ average: prevResult.average }, {
            average: results[i].average,
          }) < 0) ||
        (!ranksWithAverage && compareSingles(prevResult, results[i]) < 0))
    ) {
      ranking = i + 1;
    }

    results[i].ranking = ranking;
    prevResult = results[i];
  }

  return results;
};

export const getBaseSinglesFilter = (event: Event, best: any = { $gt: 0 }) => {
  const output: any = { eventId: event.eventId, best };
  return output;
};

export const getBaseAvgsFilter = (event: Event, average: any = { $gt: 0 }) => {
  const output: any = {
    eventId: event.eventId,
    average,
    attempts: { $size: getDefaultAverageAttempts(event) },
  };
  return output;
};

export const getUserEmailVerified = (user: IUser) => user.confirmationCodeHash === undefined && !user.cooldownStarted;

export const importEsmModule = async <T = any>(
  moduleName: string,
): Promise<T> => await (eval(`import('${moduleName}')`) as Promise<T>);

export const getWcifCompetition = (contest: IContest): IWcifCompetition => ({
  formatVersion: "1.0",
  id: contest.competitionId,
  name: contest.name,
  shortName: contest.shortName,
  persons: [],
  events: contest.events.map((ce) => getWcifCompEvent(ce)),
  schedule: contest.compDetails?.schedule ? getWcifSchedule(contest) : ({} as IWcifSchedule),
  competitorLimit: contest.competitorLimit ?? null,
  extensions: [],
});

const convertDateToWcifDate = (date: Date): string => formatInTimeZone(date, "UTC", "yyyy-MM-dd");

const getWcifCompEvent = (contestEvent: IContestEvent): IWcifEvent => ({
  id: contestEvent.event.eventId as any,
  rounds: contestEvent.rounds.map((r) => getWcifRound(r)),
  extensions: [
    {
      id: "TEMPORARY",
      specUrl: "",
      data: {
        name: contestEvent.event.name,
        participants: contestEvent.event.participants,
      },
    },
  ],
});

const getWcifRound = (round: IRound): IWcifRound => ({
  id: round.roundId,
  format: round.format,
  timeLimit: round.timeLimit ?? null,
  cutoff: round.cutoff ?? null,
  advancementCondition: null, // TO-DO: IMPLEMENT THIS!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  results: [], // TO-DO: ADD CONVERSION FROM IRESULT TO IWCIFRESULT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  extensions: [],
});

const getWcifSchedule = (contest: IContest): IWcifSchedule => ({
  startDate: convertDateToWcifDate(contest.startDate),
  numberOfDays: differenceInDays(contest.endDate, contest.startDate) + 1,
  venues: contest.compDetails.schedule.venues.map((v) => ({
    ...v,
    rooms: v.rooms.map((r) => ({
      ...r,
      activities: r.activities.map((a) => getWcifActivity(a)),
      extensions: [] as any[],
    })),
    extensions: [] as any[],
  })),
});

const getWcifActivity = (activity: IActivity): IWcifActivity => ({
  ...activity,
  name: activity.name || "",
  startTime: convertDateToWcifDate(activity.startTime),
  endTime: convertDateToWcifDate(activity.endTime),
  childActivities: activity.childActivities.map((ca) => getWcifActivity(ca)),
  extensions: [],
});
