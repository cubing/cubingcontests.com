import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { formatInTimeZone } from 'date-fns-tz';
import { InjectModel } from '@nestjs/mongoose';
import { excl } from '~/src/helpers/dbHelpers';
import { Model } from 'mongoose';
import { RecordTypeDocument } from '~/src/models/record-type.model';
import { ResultDocument } from '~/src/models/result.model';
import { EventDocument } from '~/src/models/event.model';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { WcaRecordType } from '@sh/enums';
import { UpdateRecordTypeDto } from './dto/update-record-type.dto';
import { recordTypesSeed } from '~/src/seeds/record-types.seed';
import { getBaseAvgsFilter, getBaseSinglesFilter } from '~/src/helpers/utilityFunctions';

@Injectable()
export class RecordTypesService {
  constructor(
    private readonly logger: MyLogger,
    @InjectModel('RecordType') private readonly recordTypeModel: Model<RecordTypeDocument>,
    @InjectModel('Result') private readonly resultModel: Model<ResultDocument>,
    @InjectModel('Event') private readonly eventModel: Model<EventDocument>,
  ) {}

  // Executed before the app is bootstrapped
  async onModuleInit() {
    try {
      const recordTypes: RecordTypeDocument[] = await this.recordTypeModel.find().exec();

      if (recordTypes.length === 0) {
        this.logger.log('Seeding the record types collection...');

        await this.recordTypeModel.insertMany(recordTypesSeed);

        this.logger.log('Record types collection successfully seeded');
      } else {
        this.logger.log('Record types collection already seeded');
      }
    } catch (err) {
      throw new InternalServerErrorException(`Error while seeding records types collection: ${err.message}`);
    }
  }

  async getRecordTypes(query?: any): Promise<RecordTypeDocument[]> {
    const queryFilter = query?.active ? { active: query.active } : {};

    try {
      return await this.recordTypeModel.find(queryFilter, excl).sort({ order: 1 }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // updateRTsDtoS = update record types DTOs (plural, cause it's an array)
  async updateRecordTypes(updateRTsDtoS: UpdateRecordTypeDto[]) {
    let recordTypes; // this needs to just hold the PREVIOUS record types; used for setting records below
    let events: EventDocument[];

    try {
      recordTypes = await this.recordTypeModel.find().exec();
      events = await this.eventModel.find().exec();

      for (const newRecordType of updateRTsDtoS) {
        await this.recordTypeModel.updateOne({ wcaEquivalent: newRecordType.wcaEquivalent }, newRecordType).exec();
      }
    } catch (err) {
      throw new InternalServerErrorException(`Error while creating record types: ${err.message}`);
    }

    if (!recordTypes) throw new InternalServerErrorException('Unable to find existing record types');
    if (!events) throw new InternalServerErrorException('Unable to find events while updating record types');

    // Set the records
    for (let i = 0; i < updateRTsDtoS.length; i++) {
      const wcaEquiv = updateRTsDtoS[i].wcaEquivalent;

      // TO-DO: REMOVE HARD CODING TO WR!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      if (wcaEquiv === WcaRecordType.WR) {
        // Remove records if set to inactive but was active before, or set the records for the opposite case
        if (!updateRTsDtoS[i].active && recordTypes[i].active) {
          this.logger.log(`Unsetting ${wcaEquiv} records`);

          // Remove single records
          await this.resultModel
            .updateMany({ regionalSingleRecord: wcaEquiv }, { $unset: { regionalSingleRecord: '' } })
            .exec();

          // Remove average records
          await this.resultModel
            .updateMany({ regionalAverageRecord: wcaEquiv }, { $unset: { regionalAverageRecord: '' } })
            .exec();
        } else if (updateRTsDtoS[i].active && !recordTypes[i].active) {
          try {
            for (const event of events) {
              await this.setEventSingleRecords(event, wcaEquiv);
              await this.setEventAvgRecords(event, wcaEquiv);
            }
          } catch (err) {
            throw new InternalServerErrorException(`Error while setting initial ${wcaEquiv} records: ${err.message}`);
          }
        }
      }
    }
  }

  async setEventSingleRecords(
    event: EventDocument,
    wcaEquiv: WcaRecordType,
    queryFilter: any = getBaseSinglesFilter(event),
  ) {
    const bestSingleResultsByDay = await this.resultModel
      .aggregate([
        { $match: queryFilter },
        { $group: { _id: '$date', best: { $min: '$best' } } },
        { $sort: { _id: 1 } },
      ])
      .exec();

    let currentSingleRecord = Infinity;

    for (const result of bestSingleResultsByDay) {
      // Filter out the results that were not records at the time they were achieved
      if (result.best <= currentSingleRecord) {
        currentSingleRecord = result.best;

        const date = formatInTimeZone(result._id, 'UTC', 'd MMM yyyy'); // _id is the date from the group stage
        this.logger.log(`New single ${wcaEquiv} for ${event.eventId}: ${result.best} (${date})`);

        const sameDayTiedRecordsFilter: any = queryFilter;
        sameDayTiedRecordsFilter.date = result._id;
        sameDayTiedRecordsFilter.best = result.best;

        await this.resultModel
          .updateMany(sameDayTiedRecordsFilter, { $set: { regionalSingleRecord: wcaEquiv } })
          .exec();
      }
    }
  }

  async setEventAvgRecords(event: EventDocument, wcaEquiv: WcaRecordType, queryFilter: any = getBaseAvgsFilter(event)) {
    const bestAvgResultsByDay = await this.resultModel
      .aggregate([
        { $match: queryFilter },
        { $group: { _id: '$date', average: { $min: '$average' } } },
        { $sort: { _id: 1 } },
      ])
      .exec();

    let currentAvgRecord = Infinity;

    for (const result of bestAvgResultsByDay) {
      // Filter out the results that were not records at the time they were achieved
      if (result.average <= currentAvgRecord) {
        currentAvgRecord = result.average;

        const date = formatInTimeZone(result._id, 'UTC', 'd MMM yyyy'); // _id is the date from the group stage
        this.logger.log(`New average ${wcaEquiv} for ${event.eventId}: ${result.average} (${date})`);

        const sameDayTiedRecordsFilter: any = queryFilter;
        sameDayTiedRecordsFilter.date = result._id;
        sameDayTiedRecordsFilter.average = result.average;

        await this.resultModel
          .updateMany(sameDayTiedRecordsFilter, { $set: { regionalAverageRecord: wcaEquiv } })
          .exec();
      }
    }
  }
}
