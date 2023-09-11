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
          console.log(`Unsetting ${wcaEquiv} records`);

          // Remove single records
          await this.resultModel
            .updateMany({ regionalSingleRecord: wcaEquiv }, { $unset: { regionalSingleRecord: '' } })
            .exec();

          // Remove average records
          await this.resultModel
            .updateMany({ regionalAverageRecord: wcaEquiv }, { $unset: { regionalAverageRecord: '' } })
            .exec();
        } else if (updateRTsDtoS[i].active && !recordTypes[i].active) {
          console.log(`Setting ${wcaEquiv} records`);

          try {
            for (const event of events) {
              // SET SINGLE RECORDS

              const bestSinglesByDay = await this.resultModel
                .aggregate([
                  { $match: { eventId: event.eventId, compNotPublished: { $exists: false }, best: { $gt: 0 } } },
                  { $group: { _id: '$date', best: { $min: '$best' } } },
                  { $sort: { _id: 1 } },
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
                console.log(`New single ${wcaEquiv} for event ${event.eventId}: ${singleRecord.best}`);

                // Update all tied records on the day
                await this.resultModel
                  .updateMany(
                    {
                      eventId: event.eventId,
                      date: singleRecord._id, // _id is the date from the group stage
                      best: singleRecord.best,
                    },
                    { $set: { regionalSingleRecord: wcaEquiv } },
                  )
                  .exec();
              }

              // SET AVERAGE RECORDS

              const bestAvgsByDay = await this.resultModel
                .aggregate([
                  { $match: { eventId: event.eventId, compNotPublished: { $exists: false }, average: { $gt: 0 } } },
                  { $group: { _id: '$date', average: { $min: '$average' } } },
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
                console.log(`New average ${wcaEquiv} for event ${event.eventId}: ${avgRecord.average}`);

                // Update all tied records on the day
                await this.resultModel
                  .updateMany(
                    {
                      eventId: event.eventId,
                      date: avgRecord._id,
                      average: avgRecord.average,
                    },
                    { $set: { regionalAverageRecord: wcaEquiv } },
                  )
                  .exec();
              }
            }
          } catch (err) {
            throw new InternalServerErrorException(`Error while setting initial ${wcaEquiv} records: ${err.message}`);
          }
        }
      }
    }
  }
}
