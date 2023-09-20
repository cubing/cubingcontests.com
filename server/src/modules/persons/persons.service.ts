import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { excl } from '~/src/helpers/dbHelpers';
import { PersonDocument } from '~/src/models/person.model';
import { RoundDocument } from '~/src/models/round.model';
import { CreatePersonDto } from './dto/create-person.dto';
import { IPerson } from '@sh/interfaces';
import { IPartialUser } from '~/src/helpers/interfaces/User';
import { ContestEvent } from '~/src/models/contest.model';

@Injectable()
export class PersonsService {
  constructor(
    @InjectModel('Person') private readonly personModel: Model<PersonDocument>,
    @InjectModel('Round') private readonly roundModel: Model<RoundDocument>,
  ) {}

  async getPersons(searchParam: string): Promise<PersonDocument[]> {
    try {
      if (!searchParam) {
        return await this.personModel.find({}, excl).exec();
      } else {
        return await this.personModel.find({ name: { $regex: searchParam, $options: 'i' } }, excl).exec();
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
      return await this.personModel.find(queryFilter, excl).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getCompetitionParticipants({
    competitionId,
    contestEvents,
  }: {
    competitionId?: string;
    contestEvents?: ContestEvent[];
  }): Promise<PersonDocument[]> {
    const personIds: number[] = [];
    let compRounds: RoundDocument[] = [];

    if (contestEvents) {
      for (const compEvent of contestEvents) compRounds.push(...compEvent.rounds);
    } else {
      try {
        compRounds = await this.roundModel.find({ competitionId }).populate('results').exec();
      } catch (err) {
        throw new InternalServerErrorException('Error while searching for contest rounds');
      }
    }

    for (const round of compRounds) {
      for (const result of round.results) {
        for (const personId of result.personIds) {
          if (!personIds.includes(personId)) personIds.push(personId);
        }
      }
    }

    return await this.getPersonsById(personIds);
  }

  async getPersonsTotal(): Promise<number> {
    try {
      return await this.personModel.find().count().exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async createPerson(createPersonDto: CreatePersonDto, user: IPartialUser) {
    // First check that a person with the same name, country and WCA ID does not already exist
    let duplicatePerson: PersonDocument;

    try {
      if (createPersonDto.wcaId) {
        duplicatePerson = await this.personModel.findOne({ wcaId: createPersonDto.wcaId }).exec();
      } else {
        duplicatePerson = await this.personModel
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
      newestPerson = await this.personModel.find().sort({ personId: -1 }).limit(1).exec();
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }

    // If it's not the first person to be created, get the highest person id in the DB and increment it
    if (newestPerson.length === 1) newPerson.personId = newestPerson[0].personId + 1;
    if (createPersonDto.wcaId) newPerson.wcaId = createPersonDto.wcaId.trim().toUpperCase();
    newPerson.createdBy = new mongoose.Types.ObjectId(user._id as string);

    try {
      console.log(`Creating new person with name ${newPerson.name}`);
      await this.personModel.create(newPerson);
    } catch (err) {
      throw new InternalServerErrorException(
        `Error while creating new person with name ${createPersonDto.name}: ${err.message}`,
      );
    }
  }
}
