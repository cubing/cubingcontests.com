import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePersonDto } from './dto/create-person.dto';
import { PersonDocument } from '~/src/models/person.model';
import IPerson from '@sh/interfaces/Person';

@Injectable()
export class PersonsService {
  constructor(@InjectModel('Person') private readonly model: Model<IPerson>) {}

  async getPersons() {
    try {
      const results: PersonDocument[] = await this.model.find().exec();
      return results.map((el) => ({
        personId: el.personId,
        name: el.name,
        countryId: el.countryId,
      }));
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async createPerson(createPersonDto: CreatePersonDto): Promise<number> {
    const newestPerson: PersonDocument[] = await this.model.find().sort({ personId: -1 }).limit(1).exec();
    let personId = 1;

    // If it's not the first person to be created, get the highest person id in the DB and increment it
    if (newestPerson.length > 0) {
      personId = newestPerson[0].personId + 1;
    }

    try {
      const newPerson = new this.model({ personId, ...createPersonDto });
      await newPerson.save();
      return personId;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
