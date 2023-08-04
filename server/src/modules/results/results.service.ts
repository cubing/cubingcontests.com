import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResultDocument } from '~/src/models/result.model';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { EventsService } from '@m/events/events.service';
import { PersonsService } from '@m/persons/persons.service';
import { EventFormat, WcaRecordType } from '@sh/enums';
import { IEventRecords } from '@sh/interfaces';
import { excl } from '~/src/helpers/dbHelpers';

@Injectable()
export class ResultsService {
  constructor(
    private eventsService: EventsService,
    private recordTypesService: RecordTypesService,
    private personsService: PersonsService,
    @InjectModel('Result') private readonly model: Model<ResultDocument>,
  ) {}

  async onModuleInit() {
    const results = await this.model.find({ average: { $gt: 0 } });

    for (const res of results) {
      let best: number;

      best = Math.min(...res.attempts.map((att) => (att > 0 ? att : Infinity)));
      if (best === Infinity) best = -1;

      let sum = res.attempts.reduce((prev: number, curr: number) => {
        if (prev <= 0) prev = 0;
        if (curr <= 0) return prev;
        return curr + prev;
      }) as number;

      if (res.attempts.length === 5) {
        sum -= best;
        if (!res.attempts.some((el) => el <= 0)) sum -= Math.max(...res.attempts);
      }

      const average = Math.round((sum / 3) * (res.eventId === '333fm' ? 100 : 1));

      if (average !== res.average) {
        console.log(res);
        console.log('Expected average:', average);
      }
    }
  }

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
        const newRecordByEvent: IEventRecords = { event, bestRecords: [], averageRecords: [] };

        const bestResults = await this.getEventSingleRecordResults(event.eventId, rt.label);

        for (const result of bestResults) {
          newRecordByEvent.bestRecords.push({
            result,
            persons: await this.personsService.getPersonsById(result.personId),
          });
        }

        if (event.format !== EventFormat.Multi) {
          const averageResults = await this.getEventAverageRecordResults(event.eventId, rt.label);

          for (const result of averageResults) {
            newRecordByEvent.averageRecords.push({
              result,
              persons: await this.personsService.getPersonsById(result.personId),
            });
          }
        } else {
          newRecordByEvent.averageRecords = [];
        }

        if (newRecordByEvent.bestRecords.length > 0 || newRecordByEvent.averageRecords.length > 0) {
          recordsByEvent.push(newRecordByEvent);
        }
      }
    }

    return recordsByEvent;
  }

  async getEventSingleRecordResults(
    eventId: string,
    recordLabel: string,
    beforeDate: Date = null,
  ): Promise<ResultDocument[]> {
    const queryFilter: any = { eventId, regionalSingleRecord: recordLabel, compNotPublished: { $exists: false } };
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
    recordLabel: string,
    beforeDate: Date = null,
  ): Promise<ResultDocument[]> {
    const queryFilter: any = { eventId, regionalAverageRecord: recordLabel, compNotPublished: { $exists: false } };
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
}
