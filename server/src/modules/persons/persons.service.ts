import { BadRequestException, Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { excl, exclSysButKeepCreatedBy } from '~/src/helpers/dbHelpers';
import { PersonDocument } from '~/src/models/person.model';
import { RoundDocument } from '~/src/models/round.model';
import { CreatePersonDto } from './dto/create-person.dto';
import { IFePerson, IPerson } from '@sh/types';
import { Role } from '@sh/enums';
import { IPartialUser } from '~/src/helpers/interfaces/User';
import { ContestEvent } from '~/src/models/contest.model';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { LogType } from '~/src/helpers/enums';

@Injectable()
export class PersonsService {
  constructor(
    private readonly logger: MyLogger,
    @InjectModel('Person') private readonly personModel: Model<PersonDocument>,
    @InjectModel('Round') private readonly roundModel: Model<RoundDocument>,
  ) {}

  async getPersonById(personId: number): Promise<PersonDocument> {
    try {
      return await this.personModel.findOne({ personId }, excl).exec();
    } catch (err) {
      throw new InternalServerErrorException(`Error while getting person with ID ${personId}: ${err.message}`);
    }
  }

  async getPersonsById(
    personIds: number[],
    { preserveOrder }: { preserveOrder?: boolean } = {},
  ): Promise<PersonDocument[]> {
    try {
      let persons: PersonDocument[] = await this.personModel.find({ personId: { $in: personIds } }, excl).exec();

      if (preserveOrder) persons = personIds.map((pid) => persons.find((p) => p.personId === pid));

      return persons;
    } catch (err) {
      throw new InternalServerErrorException(`Error while getting persons by person ID: ${err.message}`);
    }
  }

  async getModPersons(user: IPartialUser) {
    if (user.roles.includes(Role.Admin)) {
      // BE VERY CAREFUL HERE SO AS NOT TO EVER LEAK PASSWORD HASHES!!!
      const persons = await this.personModel
        .find({}, exclSysButKeepCreatedBy)
        .populate({ path: 'createdBy', model: 'User' })
        .exec();

      const fePersons: IFePerson[] = [];

      for (const person of persons) {
        const newFePerson: IFePerson = person.toObject();
        if (person.createdBy) {
          newFePerson.creator = {
            username: person.createdBy.username,
            email: person.createdBy.email,
            person: await this.getPersonById(person.createdBy.personId),
          };
        }
        (newFePerson as any).createdBy = undefined;
        fePersons.push(newFePerson);
      }

      return fePersons;
    } else {
      throw new NotImplementedException('NOT IMPLEMENTED');
    }
  }

  async getPersonsByName(name: string): Promise<PersonDocument[]> {
    return await this.personModel.find({ name: { $regex: name, $options: 'i' } }, excl).exec();
  }

  async getPersonByName(name: string): Promise<PersonDocument> {
    try {
      return await this.personModel.findOne({ name }, excl).exec();
    } catch (err) {
      throw new InternalServerErrorException(`Error while getting person with name ${name}: ${err.message}`);
    }
  }

  async getPersonByWcaId(wcaId: string): Promise<PersonDocument> {
    try {
      return await this.personModel.findOne({ wcaId }, excl).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getContestParticipants({
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
      compRounds = await this.roundModel.find({ competitionId }).populate('results').exec();
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
    return await this.personModel.countDocuments().exec();
  }

  async createPerson(createPersonDto: CreatePersonDto, user: IPartialUser): Promise<PersonDocument> {
    const wcaId = createPersonDto.wcaId ? `WCA ID ${createPersonDto.wcaId}` : 'no WCA ID';
    this.logger.logAndSave(`Creating person with name ${createPersonDto.name} and ${wcaId}`, LogType.CreatePerson);

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
      return await this.personModel.create(newPerson);
    } catch (err) {
      throw new InternalServerErrorException(
        `Error while creating new person with name ${createPersonDto.name}: ${err.message}`,
      );
    }
  }
}
