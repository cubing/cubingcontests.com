import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePersonDto } from './dto/create-person.dto';
import { PersonDocument } from '~/src/models/person.model';
import { excl } from '~/src/helpers/dbHelpers';

@Injectable()
export class PersonsService {
  constructor(@InjectModel('Person') private readonly model: Model<PersonDocument>) {}

  async getPersons(searchParam: string): Promise<PersonDocument[]> {
    try {
      if (!searchParam) {
        return await this.model.find({}, excl).exec();
      } else {
        return await this.model.find({ name: { $regex: searchParam, $options: 'i' } }, excl).exec();
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getPersonsById(personIds?: number[] | string): Promise<PersonDocument[]> {
    let queryFilter = {};

    if (personIds) {
      if (typeof personIds !== 'string') {
        queryFilter = { personId: { $in: personIds } };
      } else {
        queryFilter = { personId: { $in: personIds.split(';').map((el: string) => parseInt(el)) } };
      }
    }

    try {
      return await this.model.find(queryFilter, excl).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getPersonsTotal(): Promise<number> {
    try {
      return await this.model.find().count().exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async createPerson(createPersonDto: CreatePersonDto): Promise<number> {
    // First check that a person with the same name does not already exist
    let personWithSameName: PersonDocument;
    try {
      personWithSameName = await this.model.findOne({ name: createPersonDto.name }).exec();
    } catch (err: any) {
      throw new InternalServerErrorException(`Error while searching for person with the same name: ${err.message}`);
    }

    if (personWithSameName) throw new BadRequestException(`Person with name ${createPersonDto.name} already exists`);

    let newestPerson: PersonDocument[];
    let personId = 1;

    try {
      newestPerson = await this.model.find().sort({ personId: -1 }).limit(1).exec();
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }

    // If it's not the first person to be created, get the highest person id in the DB and increment it
    if (newestPerson.length === 1) {
      personId = newestPerson[0].personId + 1;
    }

    try {
      this.model.create({ personId, ...createPersonDto });
      return personId;
    } catch (err) {
      throw new InternalServerErrorException(
        `Error while creating new person with name ${createPersonDto.name}: ${err.message}`,
      );
    }
  }
}
