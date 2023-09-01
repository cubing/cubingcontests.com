import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { excl } from '~/src/helpers/dbHelpers';
import { Model } from 'mongoose';
import { RecordTypeDocument } from '~/src/models/record-type.model';
import { ResultDocument } from '~/src/models/result.model';
import { EventDocument } from '~/src/models/event.model';
import { WcaRecordType } from '@sh/enums';
import { UpdateRecordTypeDto } from './dto/update-record-type.dto';
import { recordTypesSeed } from '~/src/seeds/record-types.seed';

@Injectable()
export class RecordTypesService {
  constructor(
    @InjectModel('RecordType') private readonly recordTypeModel: Model<RecordTypeDocument>,
    @InjectModel('Result') private readonly resultModel: Model<ResultDocument>,
    @InjectModel('Event') private readonly eventModel: Model<EventDocument>,
  ) {}

  // Executed before the app is bootstrapped
  async onModuleInit() {
    try {
      const recordTypes: RecordTypeDocument[] = await this.recordTypeModel.find().exec();

      if (recordTypes.length === 0) {
        console.log('Seeding the record types collection...');

        await this.recordTypeModel.insertMany(recordTypesSeed);

        console.log('Record types collection successfully seeded');
      } else {
        console.log('Record types collection already seeded');
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

  async updateRecordTypes(updateRecordTypesDtoS: UpdateRecordTypeDto[]): Promise<void> {
    let recordTypes; // this needs to just hold the PREVIOUS record types; used for setting records below

    try {
      recordTypes = await this.recordTypeModel.find().exec();

      for (const newRecordType of updateRecordTypesDtoS) {
        await this.recordTypeModel.updateOne({ wcaEquivalent: newRecordType.wcaEquivalent }, newRecordType).exec();
      }
    } catch (err) {
      throw new InternalServerErrorException(`Error while creating record types: ${err.message}`);
    }

    // Set the records
    for (let i = 0; i < updateRecordTypesDtoS.length; i++) {
      // FOR NOW THIS ONLY WORKS FOR WR!!!
      if (updateRecordTypesDtoS[i].wcaEquivalent !== WcaRecordType.WR) break;

      // Remove records if set to inactive but was active before, or set the records for the opposite case
      if (!updateRecordTypesDtoS[i].active && recordTypes[i]?.active) {
        console.log(`Unsetting ${updateRecordTypesDtoS[i].wcaEquivalent} records`);

        await this.resultModel
          .updateMany(
            { regionalSingleRecord: updateRecordTypesDtoS[i].wcaEquivalent },
            { $unset: { regionalSingleRecord: '' } },
          )
          .exec();

        await this.resultModel
          .updateMany(
            { regionalAverageRecord: updateRecordTypesDtoS[i].wcaEquivalent },
            { $unset: { regionalAverageRecord: '' } },
          )
          .exec();
      } else if (updateRecordTypesDtoS[i].active && !recordTypes[i]?.active) {
        console.log(`Setting ${updateRecordTypesDtoS[i].wcaEquivalent} records`);

        try {
          const events: EventDocument[] = await this.eventModel.find().exec();

          for (const event of events) {
            // Set single records
            const bestSinglesByDay = await this.resultModel
              .aggregate([
                { $match: { eventId: event.eventId, compNotPublished: { $exists: false }, best: { $gt: 0 } } },
                { $sort: { date: 1 } },
                {
                  $group: {
                    _id: '$date',
                    best: { $min: '$best' },
                  },
                },
                { $sort: { _id: 1 } }, // for some reason the group stage breaks the ordering by date
              ])
              .exec();

            // THIS SEEMS SUBOPTIMAL, MAYBE DO THIS DIRECTLY IN THE QUERY SOMEHOW
            let bestResult = Infinity;
            const singleRecords = bestSinglesByDay.filter((res) => {
              if (res.best <= bestResult) {
                bestResult = res.best;
                return true;
              }
              return false;
            });

            for (const singleRecord of singleRecords) {
              console.log(
                `New single ${updateRecordTypesDtoS[i].wcaEquivalent} for event ${event.eventId}: ${singleRecord.best}`,
              );

              // Update all tied records on the day
              await this.resultModel
                .updateMany(
                  {
                    eventId: event.eventId,
                    date: singleRecord._id, // _id is actually the date from the group stage
                    best: singleRecord.best,
                  },
                  { $set: { regionalSingleRecord: updateRecordTypesDtoS[i].wcaEquivalent } },
                )
                .exec();
            }

            // Set average records
            const bestAvgsByDay = await this.resultModel
              .aggregate([
                { $match: { eventId: event.eventId, compNotPublished: { $exists: false }, average: { $gt: 0 } } },
                { $sort: { date: 1 } },
                {
                  $group: {
                    _id: '$date',
                    average: { $min: '$average' },
                  },
                },
                { $sort: { _id: 1 } },
              ])
              .exec();

            bestResult = Infinity;
            const avgRecords = bestAvgsByDay.filter((res) => {
              if (res.average <= bestResult) {
                bestResult = res.average;
                return true;
              }
              return false;
            });

            for (const avgRecord of avgRecords) {
              console.log(
                `New average ${updateRecordTypesDtoS[i].wcaEquivalent} for event ${event.eventId}: ${avgRecord.average}`,
              );

              // Update all tied records on the day
              await this.resultModel
                .updateMany(
                  {
                    eventId: event.eventId,
                    date: avgRecord._id, // _id is actually the date from the group stage
                    average: avgRecord.average,
                  },
                  { $set: { regionalAverageRecord: updateRecordTypesDtoS[i].wcaEquivalent } },
                )
                .exec();
            }
          }
        } catch (err) {
          throw new InternalServerErrorException(
            `Error while setting initial ${updateRecordTypesDtoS[i].wcaEquivalent} records: ${err.message}`,
          );
        }
      }
    }
  }
}
