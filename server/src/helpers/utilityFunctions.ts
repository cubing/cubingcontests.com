import { ResultDocument } from "~/src/models/result.model";
import { compareAvgs, compareSingles, getDefaultAverageAttempts } from "@sh/sharedFunctions";
import { IEvent } from "@sh/types";
import { IUser } from "~/src/helpers/interfaces/User";

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
