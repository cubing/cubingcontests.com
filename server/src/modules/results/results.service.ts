import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResultDocument } from '~/src/models/result.model';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { EventsService } from '@m/events/events.service';
import { PersonsService } from '@m/persons/persons.service';
import { EventFormat, WcaRecordType } from '@sh/enums';
import { IEventRecords, IRecordType } from '@sh/interfaces';
import { compareAvgs, compareSingles, getDateOnly } from '@sh/sharedFunctions';
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

  async getRecords(wcaEquivalent: string): Promise<IEventRecords[]> {
    // Make sure the requested record type is valid
    if (
      !Object.values(WcaRecordType)
        .map((el) => el.toString())
        .includes(wcaEquivalent)
    ) {
      throw new BadRequestException(`Record type ${wcaEquivalent} does not exist`);
    }

    const recordsByEvent: IEventRecords[] = [];
    const activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });
    const events = await this.eventsService.getEvents();

    for (const rt of activeRecordTypes) {
      for (const event of events) {
        const newRecordByEvent: IEventRecords = { event, bestRecords: [], avgRecords: [] };

        const bestResults = await this.getEventSingleRecordResults(event.eventId, rt.wcaEquivalent);

        for (const result of bestResults) {
          newRecordByEvent.bestRecords.push({
            result,
            persons: await this.personsService.getPersonsById(result.personIds),
          });
        }

        if (event.format !== EventFormat.Multi) {
          const averageResults = await this.getEventAverageRecordResults(event.eventId, rt.wcaEquivalent);

          for (const result of averageResults) {
            newRecordByEvent.avgRecords.push({
              result,
              persons: await this.personsService.getPersonsById(result.personIds),
            });
          }
        } else {
          newRecordByEvent.avgRecords = [];
        }

        if (newRecordByEvent.bestRecords.length > 0 || newRecordByEvent.avgRecords.length > 0) {
          recordsByEvent.push(newRecordByEvent);
        }
      }
    }

    return recordsByEvent;
  }

  async getEventSingleRecordResults(
    eventId: string,
    wcaEquivalent: WcaRecordType,
    beforeDate: Date = null,
  ): Promise<ResultDocument[]> {
    const queryFilter: any = { eventId, regionalSingleRecord: wcaEquivalent, compNotPublished: { $exists: false } };
    if (beforeDate) queryFilter.date = { $lt: beforeDate };

    // Get most recent result with a single record
    const [bestSingleResult] = await this.model.find(queryFilter, excl).sort({ date: -1 }).limit(1).exec();

    // If there haven't been any single records set for this event, return empty array
    if (!bestSingleResult) return [];

    queryFilter.best = bestSingleResult.best;

    // Get all of the single record results that tie the same single, with the oldest at the top
    const results = await this.model.find(queryFilter, excl).sort({ date: 1 }).exec();

    return results;
  }

  async getEventAverageRecordResults(
    eventId: string,
    wcaEquivalent: WcaRecordType,
    beforeDate: Date = null,
  ): Promise<ResultDocument[]> {
    const queryFilter: any = { eventId, regionalAverageRecord: wcaEquivalent, compNotPublished: { $exists: false } };
    if (beforeDate) queryFilter.date = { $lt: beforeDate };

    // Get most recent result with an average record
    const [bestAvgResult] = await this.model.find(queryFilter, excl).sort({ date: -1 }).limit(1).exec();

    // If there haven't been any average records set for this event, return empty array
    if (!bestAvgResult) return [];

    queryFilter.average = bestAvgResult.average;

    // Get all of the average record results that tie the same average, with the oldest at the top
    const results = await this.model.find(queryFilter).sort({ date: 1 }).exec();

    return results;
  }

  async createResult(createResultDto: CreateResultDto) {
    try {
      // The date is passed in as an ISO date string
      createResultDto.date = new Date(createResultDto.date);

      const activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });
      const records = await this.getEventRecords(createResultDto.eventId, activeRecordTypes, createResultDto.date);

      for (const rt of activeRecordTypes) {
        // TO-DO: REMOVE HARD CODING TO WR!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        if (rt.wcaEquivalent === WcaRecordType.WR) {
          if (createResultDto.best > 0 && compareSingles(createResultDto, records[rt.wcaEquivalent]) <= 0) {
            createResultDto.regionalSingleRecord = rt.wcaEquivalent;
          }
          if (createResultDto.average > 0 && compareAvgs(createResultDto, records[rt.wcaEquivalent], true) <= 0) {
            createResultDto.regionalAverageRecord = rt.wcaEquivalent;
          }
        }
      }

      await this.model.create(createResultDto);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /////////////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////////////

  // Returns null if no record types are active
  async getEventRecords(
    eventId: string,
    activeRecordTypes: IRecordType[],
    beforeDate: Date = null, // max date as default
  ) {
    if (activeRecordTypes.length === 0) return null;

    // If a date wasn't passed, use max date, otherwise use the passed date at midnight to compare just the dates
    if (!beforeDate) beforeDate = new Date(8640000000000000);
    else beforeDate = getDateOnly(beforeDate);

    const records: any = {};

    // Go through all active record types
    for (const rt of activeRecordTypes) {
      const newRecords = { best: -1, average: -1 };

      const singleResults = await this.getEventSingleRecordResults(eventId, rt.wcaEquivalent, beforeDate);
      if (singleResults.length > 0) newRecords.best = singleResults[0].best;

      const avgResults = await this.getEventAverageRecordResults(eventId, rt.wcaEquivalent, beforeDate);
      if (avgResults.length > 0) newRecords.average = avgResults[0].average;

      records[rt.wcaEquivalent] = newRecords;
    }

    return records;
  }
}
