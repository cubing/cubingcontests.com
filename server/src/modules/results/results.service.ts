import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResultDocument } from '~/src/models/result.model';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { EventsService } from '@m/events/events.service';
import { PersonsService } from '@m/persons/persons.service';
import { CompetitionState, WcaRecordType } from '@sh/enums';
import { IEventRecords, IRecordType, IRecordPair, IEventRecordPairs, IResultsSubmissionInfo } from '@sh/interfaces';
import { getDateOnly, setResultRecords } from '@sh/sharedFunctions';
import { excl } from '~/src/helpers/dbHelpers';
import { CreateResultDto } from './dto/create-result.dto';
import { IPartialUser } from '~/src/helpers/interfaces/User';
import { CompetitionDocument } from '~/src/models/competition.model';
import { RoundDocument } from '~/src/models/round.model';
import { sortResultsAndSetRankings } from '~/src/helpers/utilityFunctions';
import { AuthService } from '../auth/auth.service';

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

  // Gets the current records for the requested record type for all events.
  // Includes person objects for each record, and includes all ties.
  async getRecords(wcaEquivalent: string): Promise<IEventRecords[]> {
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

    const recordsByEvent: IEventRecords[] = [];
    const events = await this.eventsService.getEvents();

    for (const rt of activeRecordTypes) {
      for (const event of events) {
        const newRecordByEvent: IEventRecords = { event, records: [] };

        const [singleResults, averageResults] = await this.getEventRecordResults(event.eventId, rt.wcaEquivalent);

        for (const result of singleResults) {
          newRecordByEvent.records.push({
            type: 'single',
            result,
            persons: await this.personsService.getPersonsById(result.personIds),
            competition: result.competitionId
              ? await this.competitionModel.findOne({ competitionId: result.competitionId }, excl)
              : undefined,
          });
        }

        for (const result of averageResults) {
          newRecordByEvent.records.push({
            type: result.attempts.length === 3 ? 'mean' : 'average',
            result,
            persons: await this.personsService.getPersonsById(result.personIds),
            competition: result.competitionId
              ? await this.competitionModel.findOne({ competitionId: result.competitionId }, excl)
              : undefined,
          });
        }

        if (newRecordByEvent.records.length > 0) {
          recordsByEvent.push(newRecordByEvent);
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
    // This is put here deliberately, because this function also checks access rights!
    const comp = await this.getCompetition(createResultDto.competitionId, user);

    // The date is passed in as an ISO date string and it may also include time, if the frontend has a bug
    createResultDto.date = getDateOnly(new Date(createResultDto.date));

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
      const event = await this.eventsService.getEventById(createResultDto.eventId);

      // Create new result and update the round's results
      const newResult = await this.resultModel.create(setResultRecords(createResultDto, recordPairs));
      round.results.push(newResult);
      round.results = await sortResultsAndSetRankings(round.results, event, round.format);
      await round.save(); // save the round for resetCancelledRecords

      await this.resetCancelledRecords(createResultDto);

      comp.state = CompetitionState.Ongoing;
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
      await this.updateRecordsAfterDeletion(createResultDto);

      throw new InternalServerErrorException(`Error while creating result: ${err.message}`);
    }
  }

  async deleteCompetitionResult(resultId: string, competitionId: string, user: IPartialUser): Promise<RoundDocument> {
    // This is put here deliberately, because this function also checks access rights!
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
      round.results = await sortResultsAndSetRankings(round.results, event, round.format);
      round.save(); // save the round for updateRecordsAfterDeletion

      await this.updateRecordsAfterDeletion(result);

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
      await this.resetCancelledRecords(result);

      throw new InternalServerErrorException('Error while updating round during result deletion');
    }
  }

  async submitResult(createResultDto: CreateResultDto) {
    // The date is passed in as an ISO date string and may include time too, so the time must be removed
    createResultDto.date = getDateOnly(new Date(createResultDto.date));
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
      // Get most recent result with a single record
      const [singleRecordResult] = await this.resultModel.find(queryFilter, excl).sort({ date: -1 }).limit(1).exec();

      // If found, get all tied record results, with the oldest at the top
      if (singleRecordResult) {
        queryFilter.best = singleRecordResult.best;
        output[0] = await this.resultModel.find(queryFilter, excl).sort({ date: 1 }).exec();
      }

      delete queryFilter.regionalSingleRecord;
      delete queryFilter.best;
      queryFilter.regionalAverageRecord = wcaEquivalent;

      // Get most recent result with an average record
      const [avgRecordResult] = await this.resultModel.find(queryFilter, excl).sort({ date: -1 }).limit(1).exec();

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

  // Resets records set on the same day as the given result or after that day
  private async resetCancelledRecords(createResultDto: CreateResultDto | ResultDocument) {
    // TO-DO: IT IS POSSIBLE THAT THERE WAS STILL A RECORD, JUST OF A DIFFERENT TYPE
    try {
      // Remove single records
      await this.resultModel.updateMany(
        { eventId: createResultDto.eventId, date: { $gte: createResultDto.date }, best: { $gt: createResultDto.best } },
        { $unset: { regionalSingleRecord: '' } },
      );

      // Remove average records
      await this.resultModel.updateMany(
        {
          eventId: createResultDto.eventId,
          date: { $gte: createResultDto.date },
          average: { $gt: createResultDto.average },
        },
        { $unset: { regionalAverageRecord: '' } },
      );
    } catch (err) {
      throw new InternalServerErrorException(`Error while resetting future records: ${err.message}`);
    }
  }

  // Set records that are now recognized after a result deletion. Sets records on the same day and into the future.
  private async updateRecordsAfterDeletion(result: ResultDocument | CreateResultDto) {
    // This is done so that we get records BEFORE the date of the deleted result
    const recordsUpTo = new Date(result.date.getTime() - 1);
    const recordPairs = await this.getEventRecordPairs(result.eventId, recordsUpTo);

    // TO-DO: DIFFERENT RECORD TYPES NEED TO BE PROPERLY SUPPORTED
    for (const recordPair of recordPairs) {
      try {
        // Set single records
        await this.resultModel.updateMany(
          {
            eventId: result.eventId,
            date: { $gte: result.date },
            best: { $lte: recordPair.best, $gt: 0 },
          },
          { $set: { regionalSingleRecord: recordPair.wcaEquivalent } },
        );

        // Set average records
        await this.resultModel.updateMany(
          {
            eventId: result.eventId,
            date: { $gte: result.date },
            average: { $lte: recordPair.average, $gt: 0 },
          },
          { $set: { regionalAverageRecord: recordPair.wcaEquivalent } },
        );
      } catch (err) {
        throw new InternalServerErrorException(
          `Error while updating ${recordPair.wcaEquivalent} records after result deletion`,
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
