import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import IRecordType from '@sh/interfaces/RecordType';
import { RecordType, RecordTypeDocument } from '~/src/models/record-type.model';

@Injectable()
export class RecordTypesService {
  constructor(@InjectModel('RecordType') private readonly model: Model<RecordType>) {}

  async getRecordTypes() {
    try {
      return await this.model.find();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async createOrEditRecordTypes(newRecordTypes: IRecordType[]) {
    // If there were already record types in the DB, delete them and create new ones
    try {
      const recordTypes = await this.model.find();
      if (recordTypes.length > 0) await this.model.deleteMany({});
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    for (let recordType of newRecordTypes) {
      try {
        const newRecordType: RecordTypeDocument = new this.model(recordType);
        newRecordType.save();
      } catch (err) {
        throw new InternalServerErrorException(`Error while inserting record type: ${recordType}. ${err.message}`);
      }
    }
  }
}
