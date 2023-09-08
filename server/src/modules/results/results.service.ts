import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResultDocument } from '~/src/models/result.model';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { EventsService } from '@m/events/events.service';
import { PersonsService } from '@m/persons/persons.service';
import { ContestState, WcaRecordType } from '@sh/enums';
import {
  IEventRankings,
  IRecordType,
  IRecordPair,
  IEventRecordPairs,
  IResultsSubmissionInfo,
  IAttempt,
  ICompetition,
} from '@sh/interfaces';
import { fixTimesOverTenMinutes, getDateOnly, getRoundRanksWithAverage, setResultRecords } from '@sh/sharedFunctions';
import { excl } from '~/src/helpers/dbHelpers';
import { CreateResultDto } from './dto/create-result.dto';
import { IPartialUser } from '~/src/helpers/interfaces/User';
import { CompetitionDocument } from '~/src/models/competition.model';
import { RoundDocument } from '~/src/models/round.model';
import { setRankings } from '~/src/helpers/utilityFunctions';
import { AuthService } from '../auth/auth.service';
import { PersonDocument } from '~/src/models/person.model';

@Injectable()
export class ResultsService {
  constructor(
    private eventsService: EventsService,
    private recordTypesService: RecordTypesService,
    private personsService: PersonsService,
    private authService: AuthService,
    @InjectModel('Result') private readonly resultModel: Model<ResultDocument>,
    @InjectModel('Round') private readonly roundModel: Model<RoundDocument>,
    @InjectModel('Competition') private readonly competitionModel: Model<CompetitionDocument>,
  ) {}

  async onModuleInit() {
    const results = await this.resultModel.find().exec();

    for (const res of results) {
      if (res.attempts.length > 0 && typeof res.attempts[0] === 'number') {
        res.attempts = res.attempts.map((el) => ({ result: el })) as IAttempt[];
        console.log(JSON.stringify(res, null, 2));
        await res.save();
      }
    }
  }

  async getRankings(eventId: string, forAverage = false, show?: 'results'): Promise<IEventRankings> {
    const event = await this.eventsService.getEventById(eventId);

    if (!event) throw new BadRequestException(`Event with ID ${eventId} not found`);

    const eventRankings: IEventRankings = {
      event,
      rankings: [],
    };
    let eventResults: ResultDocument[] = [];
    const singlesFilter = { eventId, compNotPublished: { $exists: false }, best: { $gt: 0 } };
    const avgsFilter = { eventId, compNotPublished: { $exists: false }, average: { $gt: 0 } };

    if (!show) {
      // Get top persons

      const personalBests = forAverage
        ? await this.resultModel
          .aggregate([
            { $match: avgsFilter },
            { $unwind: '$personIds' },
            { $group: { _id: { personId: '$personIds' }, average: { $min: '$average' } } },
            { $sort: { average: 1 } },
            // { $limit: 100 },
          ])
          .exec()
        : await this.resultModel
          .aggregate([
            { $match: singlesFilter },
            { $unwind: '$personIds' },
            { $group: { _id: { personId: '$personIds' }, best: { $min: '$best' } } },
            { $sort: { best: 1 } },
            // { $limit: 100 },
          ])
          .exec();

      for (const pb of personalBests) {
        const result = await this.resultModel
          .findOne({ personIds: pb._id.personId, ...(forAverage ? { average: pb.average } : { best: pb.best }) }, excl)
          .exec();

        // If it's a team event...
        if (result.personIds.length > 1) {
          // Sort the person IDs in the result, so that the person, whose PR this result is, is first
          result.personIds.sort((a, b) => (a === pb._id.personId ? -1 : 0));
        }

        eventResults.push(result);
      }
    } else {
      // Get top results

      if (forAverage) {
        eventResults = await this.resultModel.find(avgsFilter, excl).sort({ average: 1 }).exec();
      } else {
        eventResults = await this.resultModel
          .aggregate([
            { $match: { eventId, compNotPublished: { $exists: false } } },
            { $unwind: { path: '$attempts', includeArrayIndex: 'attemptNumber' } },
            { $project: excl },
            { $match: { 'attempts.result': { $gt: 0 } } },
            { $sort: { 'attempts.result': 1 } },
          ])
          .exec();

        // Set the unwound attempts as best, so that the frontend can use the same logic for everything
        for (const result of eventResults) result.best = (result.attempts as any).result;
      }
    }

    const rankedResults = await setRankings(eventResults, forAverage, true);

    for (const result of rankedResults) {
      const persons: PersonDocument[] = [];

      // This is done so that the persons array stays in the right order
      for (const personId of result.personIds) {
        const [person] = await this.personsService.getPersonsById(personId);
        if (!person) throw new InternalServerErrorException(`Person with ID ${personId} not found`);
        persons.push(person);
      }

      eventRankings.rankings.push({
        type: forAverage ? 'average' : 'single',
        result,
        persons,
        competition: result.competitionId
          ? await this.competitionModel.findOne({ competitionId: result.competitionId }, excl).exec()
          : undefined,
      });
    }

    return eventRankings;
  }

  // Gets the current records for the requested record type for all events.
  // Includes person objects for each record, and includes all ties.
  async getRecords(wcaEquivalent: string): Promise<IEventRankings[]> {
    // Make sure the requested record type is valid
    if (
      !Object.values(WcaRecordType)
        .map((el) => el.toString())
        .includes(wcaEquivalent)
    ) {
      throw new BadRequestException(`Record type ${wcaEquivalent} does not exist`);
    }

    const activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });

    if (!activeRecordTypes.some((el) => el.wcaEquivalent === wcaEquivalent)) {
      throw new BadRequestException(`The record type ${wcaEquivalent} is inactive`);
    }

    const recordsByEvent: IEventRankings[] = [];
    const events = await this.eventsService.getEvents();

    for (const rt of activeRecordTypes) {
      for (const event of events) {
        const eventRecords: IEventRankings = { event, rankings: [] };

        const [singleResults, averageResults] = await this.getEventRecordResults(event.eventId, rt.wcaEquivalent);

        for (const result of singleResults) {
          eventRecords.rankings.push({
            type: 'single',
            result,
            persons: await this.personsService.getPersonsById(result.personIds),
            competition: result.competitionId
              ? await this.competitionModel.findOne({ competitionId: result.competitionId }, excl).exec()
              : undefined,
          });
        }

        for (const result of averageResults) {
          eventRecords.rankings.push({
            type: result.attempts.length === 3 ? 'mean' : 'average',
            result,
            persons: await this.personsService.getPersonsById(result.personIds),
            competition: result.competitionId
              ? await this.competitionModel.findOne({ competitionId: result.competitionId }, excl).exec()
              : undefined,
          });
        }

        if (eventRecords.rankings.length > 0) {
          recordsByEvent.push(eventRecords);
        }
      }
    }

    return recordsByEvent;
  }

  async getSubmissionInfo(recordsUpTo: Date): Promise<IResultsSubmissionInfo> {
    const submissionBasedEvents = await this.eventsService.getSubmissionBasedEvents();
    const activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });

    return {
      events: submissionBasedEvents,
      recordPairsByEvent: await this.getRecordPairs(
        submissionBasedEvents.map((el) => el.eventId),
        recordsUpTo,
        activeRecordTypes,
      ),
      activeRecordTypes,
    };
  }

  async createResult(createResultDto: CreateResultDto, roundId: string, user: IPartialUser): Promise<RoundDocument> {
    // getCompetition is put here deliberately, because this function also checks access rights!
    const comp = await this.getCompetition(createResultDto.competitionId, user);
    const event = await this.eventsService.getEventById(createResultDto.eventId);

    // The date is passed in as an ISO date string and it may also include time, if the frontend has a bug
    createResultDto.date = getDateOnly(new Date(createResultDto.date));
    fixTimesOverTenMinutes(createResultDto, event.format);

    const recordPairs = await this.getEventRecordPairs(createResultDto.eventId, createResultDto.date);
    let round: RoundDocument;
    let newResult: ResultDocument;
    let oldResults: ResultDocument[];

    try {
      round = await this.roundModel
        .findOne({ competitionId: createResultDto.competitionId, roundId })
        .populate('results')
        .exec();

      oldResults = [...round.results];

      // Create new result and update the round's results
      const newResult = await this.resultModel.create(setResultRecords(createResultDto, recordPairs));
      round.results.push(newResult);
      round.results = await setRankings(round.results, getRoundRanksWithAverage(round.format, event));
      await round.save(); // save the round for resetCancelledRecords

      await this.resetCancelledRecords(createResultDto, comp);

      if (comp.state < ContestState.Ongoing) comp.state = ContestState.Ongoing;
      comp.participants = (
        await this.personsService.getCompetitionParticipants({ competitionId: comp.competitionId })
      ).length;
      comp.save();

      const updatedRound = await this.roundModel
        .findOne({ competitionId: createResultDto.competitionId, roundId }, excl)
        .populate('results')
        .exec();

      return updatedRound;
    } catch (err) {
      if (newResult) await newResult.deleteOne();
      if (oldResults) {
        round.results = oldResults;
        await round.save();
      }
      await this.updateRecordsAfterDeletion(createResultDto, comp);

      throw new InternalServerErrorException(`Error while creating result: ${err.message}`);
    }
  }

  async deleteCompetitionResult(resultId: string, competitionId: string, user: IPartialUser): Promise<RoundDocument> {
    // getCompetition is put here deliberately, because this function also checks access rights!
    const comp = await this.getCompetition(competitionId, user);
    let result: ResultDocument;

    // Find result first
    try {
      result = await this.resultModel.findOne({ _id: resultId }).exec();
    } catch (err) {
      throw new InternalServerErrorException(`Error while deleting result: ${err.message}`);
    }

    if (!result) throw new BadRequestException(`Result with ID ${resultId} not found`);
    if (result.competitionId !== competitionId)
      throw new BadRequestException("The result's competition ID doesn't match the URL parameter");

    // Update round
    let round: RoundDocument;
    let oldResults: ResultDocument[];

    try {
      round = await this.roundModel.findOne({ results: resultId }).populate('results').exec();

      oldResults = [...round.results];
      const event = await this.eventsService.getEventById(result.eventId);

      round.results = round.results.filter((el) => el._id.toString() !== resultId);
      round.results = await setRankings(round.results, getRoundRanksWithAverage(round.format, event));
      round.save(); // save the round for updateRecordsAfterDeletion

      await this.updateRecordsAfterDeletion(result, comp);

      comp.participants = (
        await this.personsService.getCompetitionParticipants({ competitionId: comp.competitionId })
      ).length;
      await comp.save();

      // Delete the result
      await this.resultModel.deleteOne({ _id: resultId }).exec();

      const updatedRound = await this.roundModel
        .findOne({ competitionId, roundId: round.roundId }, excl)
        .populate('results')
        .exec();

      return updatedRound;
    } catch (err) {
      if (oldResults) {
        round.results = oldResults;
        await round.save();
      }
      await this.resetCancelledRecords(result, comp);

      throw new InternalServerErrorException('Error while updating round during result deletion');
    }
  }

  async submitResult(createResultDto: CreateResultDto) {
    if (!createResultDto.videoLink) throw new BadRequestException('Please enter a video link');

    const event = await this.eventsService.getEventById(createResultDto.eventId);

    // The date is passed in as an ISO date string and may include time too, so the time must be removed
    createResultDto.date = getDateOnly(new Date(createResultDto.date));
    fixTimesOverTenMinutes(createResultDto, event.format);

    const recordPairs = await this.getEventRecordPairs(createResultDto.eventId, createResultDto.date);

    // Create result or submit result if it's not for a competition
    try {
      await this.resultModel.create(setResultRecords(createResultDto, recordPairs));
    } catch (err) {
      throw new InternalServerErrorException(`Error while submitting result: ${err.message}`);
    }

    await this.resetCancelledRecords(createResultDto);
  }

  /////////////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////////////

  // Gets record pairs for multiple events
  async getRecordPairs(
    eventIds: string[],
    recordsUpTo: Date,
    activeRecordTypes: IRecordType[],
  ): Promise<IEventRecordPairs[]> {
    if (!eventIds) eventIds = (await this.eventsService.getEvents()).map((el) => el.eventId);
    recordsUpTo = getDateOnly(recordsUpTo);

    const recordPairsByEvent: IEventRecordPairs[] = [];

    // Get current records for this competition's events
    for (const eventId of eventIds) {
      recordPairsByEvent.push({
        eventId,
        recordPairs: await this.getEventRecordPairs(eventId, recordsUpTo, activeRecordTypes),
      });
    }

    return recordPairsByEvent;
  }

  private async getEventRecordPairs(
    eventId: string,
    recordsUpTo = new Date(8640000000000000), // this shouldn't include time (so the time should be midnight)
    activeRecordTypes?: IRecordType[],
  ): Promise<IRecordPair[]> {
    if (!eventId) throw new InternalServerErrorException('getEventRecordPairs received no eventId');
    if (!activeRecordTypes) activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });

    const recordPairs: IRecordPair[] = [];

    // Go through all active record types
    for (const rt of activeRecordTypes) {
      try {
        const recordPair: IRecordPair = { wcaEquivalent: rt.wcaEquivalent, best: -1, average: -1 };

        const [singleRecord] = await this.resultModel
          .find({ eventId, best: { $gt: 0 }, date: { $lte: recordsUpTo } })
          .sort({ best: 1 })
          .limit(1)
          .exec();

        if (singleRecord) recordPair.best = singleRecord.best;

        const [avgRecord] = await this.resultModel
          .find({ eventId, average: { $gt: 0 }, date: { $lte: recordsUpTo } })
          .sort({ average: 1 })
          .limit(1)
          .exec();

        if (avgRecord) recordPair.average = avgRecord.average;

        recordPairs.push(recordPair);
      } catch (err) {
        throw new InternalServerErrorException(`Error while getting ${rt.wcaEquivalent} record pair`);
      }
    }

    return recordPairs;
  }

  // Returns array of single record results (all ties) and array of average record results (all ties)
  private async getEventRecordResults(
    eventId: string,
    wcaEquivalent: WcaRecordType,
  ): Promise<[ResultDocument[], ResultDocument[]]> {
    const output: [ResultDocument[], ResultDocument[]] = [[], []];
    const queryFilter: any = {
      eventId,
      regionalSingleRecord: wcaEquivalent,
      compNotPublished: { $exists: false },
    };

    try {
      // Get fastest single record result
      const [singleRecordResult] = await this.resultModel.find(queryFilter, excl).sort({ best: 1 }).limit(1).exec();

      // If found, get all tied record results, with the oldest at the top
      if (singleRecordResult) {
        queryFilter.best = singleRecordResult.best;
        output[0] = await this.resultModel.find(queryFilter, excl).sort({ date: 1 }).exec();
      }

      delete queryFilter.regionalSingleRecord;
      delete queryFilter.best;
      queryFilter.regionalAverageRecord = wcaEquivalent;

      // Get fastest average record result
      const [avgRecordResult] = await this.resultModel.find(queryFilter, excl).sort({ average: 1 }).limit(1).exec();

      // If found, get all tied record results, with the oldest at the top
      if (avgRecordResult) {
        queryFilter.average = avgRecordResult.average;
        output[1] = await this.resultModel.find(queryFilter, excl).sort({ date: 1 }).exec();
      }

      return output;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // Resets records set on the same day as the given result or after that day. If comp is set,
  // only resets the records for that competition (used only when creating contest result, not for submitting).
  private async resetCancelledRecords(result: CreateResultDto | ResultDocument, comp?: ICompetition) {
    if (result.best <= 0 && result.average <= 0) return;

    // If the comp isn't finished, only reset its own records. If it is, meaning the deletion is done by the admin,
    // reset ALL results that are no longer records. If comp is undefined, also do it for all results.
    // THIS CODE IS SIMILAR TO updateRecordsAfterDeletion
    const queryBase: any = { eventId: result.eventId, date: { $gte: result.date } };
    if (comp && comp.state < ContestState.Finished) queryBase.competitionId = result.competitionId;

    // TO-DO: IT IS POSSIBLE THAT THERE WAS STILL A RECORD, JUST OF A DIFFERENT TYPE
    try {
      // Remove cancelled single records
      if (result.best > 0) {
        await this.resultModel
          .updateMany({ ...queryBase, best: { $gt: result.best } }, { $unset: { regionalSingleRecord: '' } })
          .exec();
      }

      // Remove cancelled average records
      if (result.average > 0) {
        await this.resultModel
          .updateMany({ ...queryBase, average: { $gt: result.average } }, { $unset: { regionalAverageRecord: '' } })
          .exec();
      }
    } catch (err) {
      throw new InternalServerErrorException(`Error while resetting cancelled WRs: ${err.message}`);
    }
  }

  async resetRecordsCancelledByPublishedComp(competitionId: string) {
    const recordResults = await this.resultModel
      .find({
        competitionId,
        $or: [{ regionalSingleRecord: { $exists: true } }, { regionalAverageRecord: { $exists: true } }],
      })
      .exec();

    for (const res of recordResults) {
      console.log(`Resetting records for ${res.eventId} from result: ${JSON.stringify(res, null, 2)}`);
      await this.resetCancelledRecords(res);
    }
  }

  // Sets records that are now recognized after a contest result deletion. Does if for all days from the result's
  // date onward. If comp is set, only sets records for that competition, otherwise does it for ALL results.
  private async updateRecordsAfterDeletion(result: ResultDocument | CreateResultDto, comp?: ICompetition) {
    if (result.best <= 0 && result.average <= 0) return;

    // If the comp isn't finished, only reset its own records. If it is, meaning the deletion is done by the admin,
    // reset ALL results that are no longer records. If comp is undefined, also do it for all results.
    // THIS CODE IS SIMILAR TO resetCancelledRecords
    const queryBase: any = { _id: { $ne: (result as any)._id }, eventId: result.eventId, date: { $gte: result.date } };
    if (comp && comp.state < ContestState.Finished) queryBase.competitionId = result.competitionId;
    else queryBase.compNotPublished = { $exists: false };

    // This is done so that we get records BEFORE the date of the deleted result
    const recordsUpTo = new Date(result.date.getTime() - 1);
    const recordPairs = await this.getEventRecordPairs(result.eventId, recordsUpTo);

    // TO-DO: DIFFERENT RECORD TYPES NEED TO BE PROPERLY SUPPORTED
    for (const rp of recordPairs) {
      try {
        // Set single records
        if (result.best > 0) {
          // Look for non-DNF singles better than the record and get the best one of those
          const [bestSingleResult] = await this.resultModel
            .find({ ...queryBase, best: { $lte: rp.best, $gt: 0 } })
            .sort({ best: 1 })
            .limit(1)
            .exec();

          if (bestSingleResult) {
            console.log(`Setting ${result.eventId} single records after deletion: ${bestSingleResult.best}`);

            // Sets all tied records
            await this.resultModel
              .updateMany(
                { ...queryBase, best: bestSingleResult.best },
                { $set: { regionalSingleRecord: rp.wcaEquivalent } },
              )
              .exec();
          }
        }

        // Set average records
        if (result.average > 0) {
          // Look for non-DNF averages better than the record and get the best one of those
          const [bestAvgResult] = await this.resultModel
            .find({ ...queryBase, average: { $lte: rp.average, $gt: 0 } })
            .sort({ average: 1 })
            .limit(1)
            .exec();

          if (bestAvgResult) {
            console.log(`Setting ${result.eventId} average records after deletion: ${bestAvgResult.average}`);

            // Sets all tied records
            await this.resultModel
              .updateMany(
                { ...queryBase, average: bestAvgResult.average },
                { $set: { regionalAverageRecord: rp.wcaEquivalent } },
              )
              .exec();
          }
        }
      } catch (err) {
        throw new InternalServerErrorException(
          `Error while updating ${rp.wcaEquivalent} records after result deletion: ${err.message}`,
        );
      }
    }
  }

  private async getCompetition(competitionId: string, user: IPartialUser): Promise<CompetitionDocument> {
    let comp: CompetitionDocument;

    try {
      comp = await this.competitionModel.findOne({ competitionId }).exec();
    } catch (err) {
      throw new InternalServerErrorException(
        `Error while searching for competition with ID ${competitionId}: ${err.message}`,
      );
    }

    if (!comp) throw new BadRequestException(`Competition with ID ${competitionId} not found`);
    else this.authService.checkAccessRightsToComp(user, comp);

    return comp;
  }
}
