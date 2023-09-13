import { compareAvgs, compareSingles } from '@sh/sharedFunctions';
import { ResultDocument } from '../models/result.model';
import { EventFormat, EventGroup } from '@sh/enums';
import { IEvent, IResult } from '@sh/interfaces';

export const setRankings = async (
  results: ResultDocument[],
  ranksWithAverage: boolean,
  dontSortOrSave = false,
): Promise<ResultDocument[]> => {
  if (results.length === 0) return results;

  let sortedResults: ResultDocument[];

  if (dontSortOrSave) {
    sortedResults = results;
  } else {
    if (ranksWithAverage) sortedResults = results.sort(compareAvgs);
    else sortedResults = results.sort(compareSingles);
  }

  let prevResult = sortedResults[0];
  let ranking = 1;

  for (let i = 0; i < sortedResults.length; i++) {
    // If the previous result was not tied with this one, increase ranking
    if (
      i > 0 &&
      ((ranksWithAverage && compareAvgs(prevResult, sortedResults[i]) < 0) ||
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

export const fixTimesOverTenMinutes = (result: IResult, event: IEvent) => {
  if (event.format === EventFormat.Time && !event.groups.includes(EventGroup.ExtremeBLD)) {
    if (result.best > 60000) result.best -= result.best % 100;

    result.attempts = result.attempts.map((att) =>
      att.result > 60000 ? { ...att, result: att.result - (att.result % 100) } : att,
    );
  }
};
