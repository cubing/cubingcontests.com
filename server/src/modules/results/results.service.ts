import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResultDocument } from '~/src/models/result.model';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { EventsService } from '@m/events/events.service';
import { PersonsService } from '@m/persons/persons.service';
import { WcaRecordType } from '@sh/enums';
import { IEventRecords, IRecordType, IRecordPair, IEventRecordPairs, IResultsSubmissionInfo } from '@sh/interfaces';
import { getDateOnly, setNewRecordsForResult } from '@sh/sharedFunctions';
import { excl } from '~/src/helpers/dbHelpers';
import { CreateResultDto } from './dto/create-result.dto';

@Injectable()
export class ResultsService {
  constructor(
    private eventsService: EventsService,
    private recordTypesService: RecordTypesService,
    private personsService: PersonsService,
    @InjectModel('Result') private readonly model: Model<ResultDocument>,
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
        const newRecordByEvent: IEventRecords = { event, bestRecords: [], avgRecords: [] };

        const [singleResults, averageResults] = await this.getEventRecordResults(event.eventId, rt.wcaEquivalent);

        for (const result of singleResults) {
          newRecordByEvent.bestRecords.push({
            result,
            persons: await this.personsService.getPersonsById(result.personIds),
          });
        }

        for (const result of averageResults) {
          newRecordByEvent.avgRecords.push({
            result,
            persons: await this.personsService.getPersonsById(result.personIds),
          });
        }

        if (newRecordByEvent.bestRecords.length > 0 || newRecordByEvent.avgRecords.length > 0) {
          recordsByEvent.push(newRecordByEvent);
        }
      }
    }

    return recordsByEvent;
  }

  async getSubmissionInfo(beforeDate: Date): Promise<IResultsSubmissionInfo> {
    const submissionBasedEvents = await this.eventsService.getSubmissionBasedEvents();
    const activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });

    return {
      events: submissionBasedEvents,
      recordPairsByEvent: await this.getRecordPairs(
        submissionBasedEvents.map((el) => el.eventId),
        beforeDate,
        activeRecordTypes,
      ),
      activeRecordTypes,
    };
  }

  async createResult(createResultDto: CreateResultDto) {
    try {
      // The date is passed in as an ISO date string and may include time too, so the time must be removed
      createResultDto.date = getDateOnly(new Date(createResultDto.date));

      const recordPairs = await this.getEventRecordPairs(createResultDto.eventId, createResultDto.date);

      await this.model.create(setNewRecordsForResult(createResultDto, recordPairs));

      // TO-DO: IT IS POSSIBLE THAT THERE WAS STILL A RECORD, JUST OF A DIFFERENT TYPE

      // Remove records that came AFTER the new result (or on the same day), if they were worse
      await this.model.updateMany(
        { date: { $gte: createResultDto.date }, best: { $gt: createResultDto.best } },
        { $unset: { regionalSingleRecord: '' } },
      );

      // Remove records that came AFTER the new result (or on the same day), if they were worse
      await this.model.updateMany(
        { date: { $gte: createResultDto.date }, average: { $gt: createResultDto.average } },
        { $unset: { regionalAverageRecord: '' } },
      );
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /////////////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////////////

  async getEventRecordPairs(
    eventId: string,
    beforeDate?: Date,
    activeRecordTypes?: IRecordType[],
  ): Promise<IRecordPair[]> {
    if (!activeRecordTypes) activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });

    // If beforeDate is undefined, use max date, otherwise get the date only (ignore time)
    if (!beforeDate) beforeDate = new Date(8640000000000000);
    else beforeDate = getDateOnly(beforeDate);

    const recordPairs: IRecordPair[] = [];

    // Go through all active record types
    for (const rt of activeRecordTypes) {
      try {
        const recordPair: IRecordPair = { wcaEquivalent: rt.wcaEquivalent, best: -1, average: -1 };

        const [singleRecord] = await this.model
          .find({ eventId, best: { $gt: 0 }, date: { $lt: beforeDate } })
          .sort({ best: 1 })
          .limit(1)
          .exec();

        if (singleRecord) recordPair.best = singleRecord.best;

        const [avgRecord] = await this.model
          .find({ eventId, average: { $gt: 0 }, date: { $lt: beforeDate } })
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
  async getEventRecordResults(
    eventId: string,
    wcaEquivalent: WcaRecordType,
    beforeDate: Date = null,
  ): Promise<[ResultDocument[], ResultDocument[]]> {
    const output: [ResultDocument[], ResultDocument[]] = [[], []];
    const queryFilter: any = {
      eventId,
      regionalSingleRecord: wcaEquivalent,
      compNotPublished: { $exists: false },
    };

    if (beforeDate) queryFilter.date = { $lt: beforeDate };

    try {
      // Get most recent result with a single record
      const [singleRecordResult] = await this.model.find(queryFilter, excl).sort({ date: -1 }).limit(1).exec();

      // If found, get all tied record results, with the oldest at the top
      if (singleRecordResult) {
        queryFilter.best = singleRecordResult.best;
        output[0] = await this.model.find(queryFilter, excl).sort({ date: 1 }).exec();
      }

      delete queryFilter.regionalSingleRecord;
      delete queryFilter.best;
      queryFilter.regionalAverageRecord = wcaEquivalent;

      // Get most recent result with an average record
      const [avgRecordResult] = await this.model.find(queryFilter, excl).sort({ date: -1 }).limit(1).exec();

      // If found, get all tied record results, with the oldest at the top
      if (avgRecordResult) {
        queryFilter.average = avgRecordResult.average;
        output[1] = await this.model.find(queryFilter, excl).sort({ date: 1 }).exec();
      }

      return output;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // Gets record pairs for multiple events
  async getRecordPairs(
    eventIds: string[],
    beforeDate: Date,
    activeRecordTypes: IRecordType[],
  ): Promise<IEventRecordPairs[]> {
    if (!eventIds) eventIds = (await this.eventsService.getEvents()).map((el) => el.eventId);

    const recordPairsByEvent: IEventRecordPairs[] = [];

    // Get current records for this competition's events
    for (const eventId of eventIds) {
      recordPairsByEvent.push({
        eventId,
        recordPairs: await this.getEventRecordPairs(eventId, beforeDate, activeRecordTypes),
      });
    }

    return recordPairsByEvent;
  }
}
