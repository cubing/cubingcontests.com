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

  // THIS IS TEMPORARY!!!
  async onModuleInit() {
    const people = await this.model.find({
      localizedName: { $exists: false },
      wcaId: { $exists: true },
    });

    for (const person of people) {
      const data = await fetch(`https://www.worldcubeassociation.org/api/v0/persons/${person.wcaId}`);
      const json: any = await data.json();

      if (json?.person?.name.includes(' (')) {
        person.localizedName = json.person.name.split(' (')[1].slice(0, -1);
        await person.save();
        console.log('Saved with localized name:', person);
      }
    }
  }

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

  async getPersonsById(personIds?: number[] | number): Promise<PersonDocument[]> {
    let queryFilter = {};

    if (personIds) {
      if (typeof personIds === 'number') {
        queryFilter = { personId: personIds };
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
      if (createPersonDto.wcaId) {
        duplicatePerson = await this.model.findOne({ wcaId: createPersonDto.wcaId }).exec();
      } else {
        duplicatePerson = await this.model
          .findOne({ name: createPersonDto.name, countryIso2: createPersonDto.countryIso2 })
          .exec();
      }
    } catch (err: any) {
      throw new InternalServerErrorException(`Error while searching for person with the same name: ${err.message}`);
    }

    if (duplicatePerson) {
      if (createPersonDto.wcaId) throw new BadRequestException('A person with the same WCA ID already exists');
      throw new BadRequestException('A person with the same name and country already exists');
    }

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
      console.log(`Creating new person with name ${newPerson.name}`);
      await this.model.create(newPerson);
    } catch (err) {
      throw new InternalServerErrorException(
        `Error while creating new person with name ${createPersonDto.name}: ${err.message}`,
      );
    }
  }
}
