import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePersonDto } from './dto/create-person.dto';
import { PersonDocument } from '~/src/models/person.model';

@Injectable()
export class PersonsService {
  constructor(@InjectModel('Person') private readonly model: Model<CreatePersonDto>) {}

  async getPersons() {
    try {
      const results: PersonDocument[] = await this.model.find().exec();
      return results.map((el) => ({
        personId: el.personId,
        name: el.name,
        country: el.country,
      }));
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async createPerson(createPersonDto: CreatePersonDto) {
    const person: PersonDocument = await this.model.findOne({
      personId: createPersonDto.personId,
    });

    if (person) {
      throw new BadRequestException(`Person with id ${createPersonDto.personId} already exists!`);
    }

    try {
      const newPerson = new this.model(createPersonDto);
      await newPerson.save();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
