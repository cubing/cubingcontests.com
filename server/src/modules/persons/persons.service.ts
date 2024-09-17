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
import { PersonDto } from './dto/person.dto';
import { IFePerson, IPersonDto, IWcaPersonDto } from '@sh/types';
import { fetchWcaPerson } from '@sh/sharedFunctions';
import { Role } from '@sh/enums';
import { IPartialUser } from '~/src/helpers/interfaces/User';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { LogType } from '~/src/helpers/enums';

@Injectable()
export class PersonsService {
  constructor(
    private readonly logger: MyLogger,
    @InjectModel('Person') private readonly personModel: Model<PersonDocument>,
    @InjectModel('Round') private readonly roundModel: Model<RoundDocument>,
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

    if (process.env.DO_DB_CONSISTENCY_CHECKS === 'true') {
      const persons = await this.personModel.find().exec();
      for (const person of persons) {
        if (persons.some((p) => p.personId !== person.personId && p.name === person.name))
          this.logger.error(`Error: multiple persons found with the name ${person.name}`);
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
    { preserveOrder, unapprovedOnly }: { preserveOrder?: boolean; unapprovedOnly?: boolean } = {},
  ): Promise<PersonDocument[]> {
    const query: any = { personId: { $in: personIds } };
    if (unapprovedOnly) query.unapproved = true;
    let persons: PersonDocument[] = await this.personModel.find(query, excl).exec();

    if (preserveOrder) persons = personIds.map((pid) => persons.find((p) => p.personId === pid));

    return persons;
  }

  async getModPersons(user: IPartialUser): Promise<IFePerson[]> {
    if (user.roles.includes(Role.Admin)) {
      // BE VERY CAREFUL HERE SO AS NOT TO EVER LEAK PASSWORD HASHES!!!
      const persons = await this.personModel
        .aggregate([
          { $project: { ...exclSysButKeepCreatedBy } },
          // Keep in mind creator and creatorPerson end up as arrays with one element (or none if not found)
          { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'creator' } },
          { $lookup: { from: 'people', localField: 'creator.personId', foreignField: 'personId', as: 'crtrPerson' } },
          { $sort: { personId: -1 } },
        ])
        .exec();

      for (const person of persons) {
        const creator = person.creator[0];
        const creatorPerson = person.crtrPerson[0];
        // If the creator is a deleted user now, creator is undefined, but createdBy isn't. If the creator is an external device, createdBy is undefined.
        if (creator) {
          person.creator = {
            username: creator.username,
            email: creator.email,
            person: creatorPerson ? { name: creatorPerson.name, wcaId: creatorPerson.wcaId } : undefined,
          };
        } else if (person.createdBy === undefined) {
          person.creator = 'EXT_DEVICE';
        } else {
          person.creator = undefined;
        }
        person.createdBy = undefined;
        person.crtrPerson = undefined;
      }

      return persons;
    } else {
      return await this.personModel
        .find({ createdBy: new mongo.ObjectId(user._id as string) }, excl)
        .sort({ personId: -1 })
        .exec();
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

  // This takes either a contest ID or the populated contest events
  async getContestParticipants({
    competitionId,
    contestEvents,
    unapprovedOnly,
  }: {
    competitionId?: string;
    contestEvents?: ContestEvent[];
    unapprovedOnly?: boolean;
  }): Promise<PersonDocument[]> {
    const personIds: number[] = [];
    let compRounds: RoundDocument[] = [];

    if (contestEvents) for (const compEvent of contestEvents) compRounds.push(...compEvent.rounds);
    else compRounds = await this.roundModel.find({ competitionId }).populate(resultPopulateOptions).exec();

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

    return await this.getPersonsByPersonIds(personIds, { unapprovedOnly });
  }

  async getTotalPersons(queryFilter: any = {}): Promise<number> {
    return await this.personModel.countDocuments(queryFilter).exec();
  }

  async createPerson(
    personDto: PersonDto,
    { user }: { user: IPartialUser | 'EXT_DEVICE' },
  ): Promise<PersonDocument | IFePerson> {
    this.logger.logAndSave(
      `Creating person with name ${personDto.name} and ${personDto.wcaId ? `WCA ID ${personDto.wcaId}` : 'no WCA ID'}`,
      LogType.CreatePerson,
    );

    await this.validateAndCleanUpPerson(personDto);

    const [newestPerson] = await this.personModel.find({}, { personId: 1 }).sort({ personId: -1 }).limit(1).exec();
    const createdPerson = await this.personModel.create({
      ...personDto,
      unapproved: true,
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

    await this.validateAndCleanUpPerson(personDto, { excludeId: id });

    const person = await this.personModel.findById(id).exec();
    if (!person) throw new NotFoundException('Person not found');

    const isAdmin = user.roles.includes(Role.Admin);

    if (!isAdmin && !person.unapproved)
      throw new BadRequestException('You may not edit a person who has competed in a published contest');

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

    return this.getFrontendPerson(person, { user });
  }

  // Returns array of competitors who couldn't be approved
  async approvePersons({
    personIds,
    competitionId,
    wcaCompData,
  }: {
    personIds?: number[];
    competitionId?: string;
    wcaCompData?: unknown[];
  }) {
    const competitors = personIds
      ? await this.getPersonsByPersonIds(personIds)
      : await this.getContestParticipants({ competitionId, unapprovedOnly: true });

    for (const competitor of competitors) {
      if (competitor.unapproved) {
        if (!competitor.wcaId && wcaCompData) {
          const res = await fetch(
            `https://www.worldcubeassociation.org/api/v0/search/users?persons_table=true&q=${competitor.name}`,
          );
          if (res.ok) {
            const { result: wcaPersons } = await res.json();
            if (
              wcaPersons?.length === 1 &&
              wcaPersons[0].name === competitor.name &&
              wcaPersons[0].country_iso2 === competitor.countryIso2
            ) {
              competitor.wcaId = wcaPersons[0].wca_id;
            }
          }
        }

        if (competitor.wcaId) {
          competitor.unapproved = undefined;
          await competitor.save();
        }
      }
    }
  }

  private async validateAndCleanUpPerson(personDto: PersonDto, { excludeId }: { excludeId?: string } = {}) {
    const queryBase: any = excludeId ? { _id: { $ne: excludeId } } : {};

    if (personDto.wcaId?.trim()) {
      personDto.wcaId = personDto.wcaId.trim().toUpperCase();
      const sameWcaIdPerson = await this.personModel.findOne({ ...queryBase, wcaId: personDto.wcaId }).exec();
      if (sameWcaIdPerson) throw new ConflictException('A person with the same WCA ID already exists');
    }

    const sameNamePerson = await this.personModel.findOne({ ...queryBase, name: personDto.name }).exec();
    if (sameNamePerson) throw new ConflictException('A person with the same name already exists');
  }

  private getFrontendPerson(person: PersonDocument, { user }: { user?: IPartialUser | 'EXT_DEVICE' } = {}): IFePerson {
    const fePerson: IFePerson = person.toObject();

    // Remove system fields
    Object.keys(excl).forEach((key) => delete (fePerson as any)[key]);

    if (user && user !== 'EXT_DEVICE') fePerson.creator = { username: user.username, email: '' };

    return fePerson;
  }
}
