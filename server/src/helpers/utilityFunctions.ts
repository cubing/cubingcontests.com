import { ResultDocument } from "~/src/models/result.model";
import { compareAvgs, compareSingles, getDefaultAverageAttempts } from "@sh/sharedFunctions";
import { IActivity, IContest, IContestEvent, IEvent, IRound, IWcifActivity, IWcifCompetition, IWcifEvent, IWcifRound, IWcifSchedule } from "@sh/types";
import { IUser } from "~/src/helpers/interfaces/User";
import { formatInTimeZone } from "date-fns-tz";
import { differenceInDays } from "date-fns";

export const setRankings = async (
  results: ResultDocument[],
  {
    ranksWithAverage,
    dontSortOrSave,
    noTieBreakerForAvgs,
  }: { ranksWithAverage?: boolean; dontSortOrSave?: boolean; noTieBreakerForAvgs?: boolean },
): Promise<ResultDocument[]> => {
  if (results.length === 0) return results;

  let sortedResults: ResultDocument[];

  if (dontSortOrSave) {
    sortedResults = results;
  } else if (ranksWithAverage) {
    sortedResults = results.sort((a, b) => compareAvgs(a, b, noTieBreakerForAvgs));
  } else {
    sortedResults = results.sort(compareSingles);
  }

  let prevResult = sortedResults[0];
  let ranking = 1;

  for (let i = 0; i < sortedResults.length; i++) {
    // If the previous result was not tied with this one, increase ranking
    if (
      i > 0 &&
      ((ranksWithAverage && compareAvgs(prevResult, sortedResults[i], noTieBreakerForAvgs) < 0) ||
        (!ranksWithAverage && compareSingles(prevResult, sortedResults[i]) < 0))
    ) {
      ranking = i + 1;
    }

    sortedResults[i].ranking = ranking;
    prevResult = sortedResults[i];
    if (!dontSortOrSave) await sortedResults[i].save(); // update the result in the DB
  }

  return sortedResults;
};

export const getBaseSinglesFilter = (event: IEvent, best: any = { $gt: 0 }) => {
  const output: any = { eventId: event.eventId, best };
  return output;
};

export const getBaseAvgsFilter = (event: IEvent, average: any = { $gt: 0 }) => {
  const output: any = { eventId: event.eventId, average, attempts: { $size: getDefaultAverageAttempts(event) } };
  return output;
};

export const getUserEmailVerified = (user: IUser) => user.confirmationCodeHash === undefined && !user.cooldownStarted;

export const importEsmModule = async <T = any>(moduleName: string): Promise<T> =>
  await (eval(`import('${moduleName}')`) as Promise<T>);

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
      data: { name: contestEvent.event.name, participants: contestEvent.event.participants },
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
      extensions: [],
    })),
    extensions: [],
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
