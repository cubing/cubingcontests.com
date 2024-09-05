import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { mongo, Model } from 'mongoose';
import { excl, exclSysButKeepCreatedBy, resultPopulateOptions } from '~/src/helpers/dbHelpers';
import { PersonDocument } from '~/src/models/person.model';
import { RoundDocument } from '~/src/models/round.model';
import { ContestEvent } from '~/src/models/contest.model';
import { ResultDocument } from '~/src/models/result.model';
import { PersonDto } from './dto/person.dto';
import { IFePerson, IPersonDto, IWcaPersonDto } from '@sh/types';
import { fetchWcaPerson } from '@sh/sharedFunctions';
import { Role } from '@sh/enums';
import { IPartialUser } from '~/src/helpers/interfaces/User';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { LogType } from '~/src/helpers/enums';

const getApprovedContestResultQuery = (personId: number) => ({
  competitionId: { $exists: true },
  unapproved: { $exists: false },
  personIds: personId,
});

@Injectable()
export class PersonsService {
  constructor(
    private readonly logger: MyLogger,
    @InjectModel('Person') private readonly personModel: Model<PersonDocument>,
    @InjectModel('Round') private readonly roundModel: Model<RoundDocument>,
    @InjectModel('Result') private readonly resultModel: Model<ResultDocument>,
  ) {}

  async onModuleInit() {
    if (process.env.NODE_ENV !== 'production') {
      const anyPerson = await this.personModel.findOne().exec();

      if (!anyPerson) {
        this.logger.log('Creating test competitors for development...');

        await this.personModel.create({ name: 'Test Admin', countryIso2: 'CH', personId: 1 });
        await this.personModel.create({ name: 'Test Moderator', countryIso2: 'NR', personId: 2 });
      }
    }
  }

  async getPersonByPersonId(personId: number, { customError }: { customError?: string } = {}): Promise<IFePerson> {
    const person = await this.personModel.findOne({ personId }, excl).exec();
    if (!person) throw new NotFoundException(customError ?? `Person with ID ${personId} not found`);
    return person;
  }

  async getPersonsByPersonIds(
    personIds: number[],
    { preserveOrder }: { preserveOrder?: boolean } = {},
  ): Promise<PersonDocument[]> {
    let persons: PersonDocument[] = await this.personModel.find({ personId: { $in: personIds } }, excl).exec();

    if (preserveOrder) persons = personIds.map((pid) => persons.find((p) => p.personId === pid));

    return persons;
  }

  async getModPersons(user: IPartialUser): Promise<IFePerson[]> {
    if (user.roles.includes(Role.Admin)) {
      // BE VERY CAREFUL HERE SO AS NOT TO EVER LEAK PASSWORD HASHES!!!
      const persons = await this.personModel
        .find({}, exclSysButKeepCreatedBy)
        .populate({ path: 'createdBy', model: 'User' })
        .sort({ personId: -1 })
        .exec();

      const fePersons: IFePerson[] = [];

      for (const person of persons) {
        const newFePerson: IFePerson = { ...person.toObject(), isEditable: true };

        if (person.createdBy) {
          newFePerson.creator = {
            username: person.createdBy.username,
            email: person.createdBy.email,
            person: person.createdBy.personId ? await this.getPersonByPersonId(person.createdBy.personId) : null,
          };
        }
        // createdBy = null, when there was a creator, but it's a deleted user; external devices just leave it undefined
        else if (person.createdBy === undefined) {
          newFePerson.creator = 'EXT_DEVICE';
        }

        (newFePerson as any).createdBy = undefined; // THIS IS CRUCIAL, BECAUSE IT REMOVES ALL UNNEEDED USER DATA, INCLUDING THE PASSWORD HASH
        fePersons.push(newFePerson);
      }

      return fePersons;
    } else {
      const persons = await this.personModel
        .find({ createdBy: new mongo.ObjectId(user._id as string) }, excl)
        .sort({ personId: -1 })
        .exec();

      const fePersons: IFePerson[] = [];

      for (const person of persons) {
        const newFePerson: IFePerson = person.toObject();
        const approvedResult = await this.resultModel.findOne(getApprovedContestResultQuery(person.personId)).exec();
        if (!approvedResult) newFePerson.isEditable = true;
        fePersons.push(newFePerson);
      }

      return fePersons;
    }
  }

  async getPersonsByName(name: string): Promise<IFePerson[]> {
    return await this.personModel
      .find({ name: { $regex: name, $options: 'i' } }, excl)
      .limit(10)
      .exec();
  }

  async getPersonByName(name: string): Promise<IFePerson> {
    return await this.personModel.findOne({ name }, excl).exec();
  }

  async getOrCreatePersonByWcaId(
    wcaId: string,
    { user }: { user: IPartialUser | 'EXT_DEVICE' },
  ): Promise<IWcaPersonDto> {
    wcaId = wcaId.toUpperCase();

    // Try to find existing person with the given WCA ID
    const person = await this.personModel.findOne({ wcaId }, excl).exec();
    if (person) return { person: this.getFrontendPerson(person), isNew: false };

    // Create new person by fetching the person data from the WCA API
    const wcaPerson = await fetchWcaPerson(wcaId);
    if (!wcaPerson) throw new NotFoundException(`Person with WCA ID ${wcaId} not found`);

    return { person: await this.createPerson(wcaPerson, { user }), isNew: true };
  }

  async getContestParticipants({
    competitionId,
    contestEvents,
  }: {
    competitionId?: string;
    contestEvents?: ContestEvent[];
  }): Promise<IFePerson[]> {
    const personIds: number[] = [];
    let compRounds: RoundDocument[] = [];

    if (contestEvents) {
      for (const compEvent of contestEvents) compRounds.push(...compEvent.rounds);
    } else {
      compRounds = await this.roundModel.find({ competitionId }).populate(resultPopulateOptions).exec();
    }

    for (const round of compRounds) {
      for (const result of round.results) {
        if (!result.personIds) {
          this.logger.error('Round results are not populated');
          throw new InternalServerErrorException();
        }

        for (const personId of result.personIds) {
          if (!personIds.includes(personId)) personIds.push(personId);
        }
      }
    }

    return await this.getPersonsByPersonIds(personIds);
  }

  async getPersonsTotal(): Promise<number> {
    return await this.personModel.countDocuments().exec();
  }

  async createPerson(
    personDto: PersonDto,
    { user }: { user: IPartialUser | 'EXT_DEVICE' },
  ): Promise<PersonDocument | IFePerson> {
    this.logger.logAndSave(
      `Creating person with name ${personDto.name} and ${personDto.wcaId ? `WCA ID ${personDto.wcaId}` : 'no WCA ID'}`,
      LogType.CreatePerson,
    );

    // First check that a person with the same name, country and WCA ID does not already exist
    let duplicatePerson: PersonDocument;

    if (personDto.wcaId) {
      personDto.wcaId = personDto.wcaId.trim().toUpperCase();
      duplicatePerson = await this.personModel.findOne({ wcaId: personDto.wcaId }).exec();
    } else {
      duplicatePerson = await this.personModel
        .findOne({ name: personDto.name, countryIso2: personDto.countryIso2 })
        .exec();
    }

    if (duplicatePerson) {
      if (personDto.wcaId) throw new BadRequestException('A person with the same WCA ID already exists');
      throw new BadRequestException('A person with the same name and country already exists');
    }

    const [newestPerson] = await this.personModel.find({}, { personId: 1 }).sort({ personId: -1 }).limit(1).exec();

    const createdPerson = await this.personModel.create({
      ...personDto,
      personId: newestPerson ? newestPerson.personId + 1 : 1,
      createdBy: user !== 'EXT_DEVICE' ? new mongo.ObjectId(user._id as string) : undefined,
    });

    return this.getFrontendPerson(createdPerson, { user });
  }

  async updatePerson(id: string, personDto: PersonDto, user: IPartialUser): Promise<IFePerson> {
    this.logger.logAndSave(
      `Updating person with name ${personDto.name} and ${personDto.wcaId ? `WCA ID ${personDto.wcaId}` : 'no WCA ID'}`,
      LogType.UpdatePerson,
    );

    const person = await this.personModel.findById(id).exec();
    if (!person) throw new NotFoundException('Person not found');

    if (personDto.wcaId) {
      personDto.wcaId = personDto.wcaId.toUpperCase();
      const sameWcaIdPerson = await this.personModel.findOne({ _id: { $ne: id }, wcaId: personDto.wcaId });
      if (sameWcaIdPerson) throw new ConflictException('Another competitor already has that WCA ID');
    }

    const approvedResult = await this.resultModel.findOne(getApprovedContestResultQuery(person.personId)).exec();
    const isAdmin = user.roles.includes(Role.Admin);

    if (!isAdmin && approvedResult) {
      throw new BadRequestException(
        'You may not edit a person who has competetd in a published contest. Please contact the admins.',
      );
    }

    if (personDto.wcaId) {
      const wcaPerson: IPersonDto = await fetchWcaPerson(personDto.wcaId);
      if (!wcaPerson) throw new NotFoundException(`Person with WCA ID ${personDto.wcaId} not found`);

      person.wcaId = personDto.wcaId;
      person.name = wcaPerson.name;
      person.localizedName = wcaPerson.localizedName;
      person.countryIso2 = wcaPerson.countryIso2;
    } else {
      if (person.wcaId) person.wcaId = undefined;
      person.name = personDto.name;
      person.localizedName = personDto.localizedName;
      person.countryIso2 = personDto.countryIso2;
    }

    await person.save();

    return this.getFrontendPerson(person, { isEditable: !approvedResult, user });
  }

  private getFrontendPerson(
    person: PersonDocument,
    { isEditable, user }: { isEditable?: boolean; user?: IPartialUser | 'EXT_DEVICE' } = {},
  ): IFePerson {
    const fePerson: IFePerson = person.toObject();
    if (isEditable) fePerson.isEditable = true;

    // Remove system fields
    Object.keys(excl).forEach((key) => delete (fePerson as any)[key]);

    if (user && user !== 'EXT_DEVICE') fePerson.creator = { username: user.username, email: '' };

    return fePerson;
  }
}
