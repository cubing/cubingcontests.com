import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePersonDto } from './dto/create-person.dto';
import { PersonDocument } from '~/src/models/person.model';
import { excl } from '~/src/helpers/dbHelpers';
import { IPerson } from '@sh/interfaces';

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

  async getPersonsById(personIds?: number[] | number | string): Promise<PersonDocument[]> {
    let queryFilter = {};

    if (personIds) {
      if (typeof personIds === 'number') {
        queryFilter = { personId: personIds };
      }
      // Results store the person ID as a string
      else if (typeof personIds === 'string') {
        // Team events store multiple  person IDs, separated by semicolons
        queryFilter = { personId: { $in: personIds.split(';').map((el: string) => parseInt(el)) } };
      } else {
        queryFilter = { personId: { $in: personIds } };
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

  async createPerson(createPersonDto: CreatePersonDto) {
    // First check that a person with the same name, country and WCA ID does not already exist
    let duplicatePerson: PersonDocument;

    try {
      duplicatePerson = await this.model
        .findOne({ name: createPersonDto.name, countryIso2: createPersonDto.countryIso2, wcaId: createPersonDto.wcaId })
        .exec();
    } catch (err: any) {
      throw new InternalServerErrorException(`Error while searching for person with the same name: ${err.message}`);
    }

    if (duplicatePerson)
      throw new BadRequestException('A person with the same name, country and WCA ID already exists');

    let newestPerson: PersonDocument[];
    const newPerson = createPersonDto as IPerson;

    try {
      newestPerson = await this.model.find().sort({ personId: -1 }).limit(1).exec();
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }

    // If it's not the first person to be created, get the highest person id in the DB and increment it
    if (newestPerson.length === 1) {
      newPerson.personId = newestPerson[0].personId + 1;
    }

    if (createPersonDto.wcaId) newPerson.wcaId = createPersonDto.wcaId.trim().toUpperCase();

    try {
      await this.model.create(newPerson);
    } catch (err) {
      throw new InternalServerErrorException(
        `Error while creating new person with name ${createPersonDto.name}: ${err.message}`,
      );
    }
  }
}
