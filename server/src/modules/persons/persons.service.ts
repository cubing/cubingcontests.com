import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, mongo } from "mongoose";
import { excl, exclSysButKeepCreatedBy, resultPopulateOptions } from "~/src/helpers/dbHelpers";
import { PersonDocument } from "~/src/models/person.model";
import { RoundDocument } from "~/src/models/round.model";
import { ContestDocument, ContestEventModel } from "~/src/models/contest.model";
import { PersonDto } from "./dto/person.dto";
import { IFePerson, IPersonDto, IWcaPersonDto } from "~/shared/types";
import { fetchWcaPerson, getNameAndLocalizedName, getSimplifiedString } from "~/shared/sharedFunctions";
import { Role } from "~/shared/enums";
import { IPartialUser } from "~/src/helpers/interfaces/User";
import { MyLogger } from "@m/my-logger/my-logger.service";
import { LogType } from "~/src/helpers/enums";
import { ResultDocument } from "~/src/models/result.model";
import { UserDocument } from "~/src/models/user.model";

@Injectable()
export class PersonsService {
  constructor(
    private readonly logger: MyLogger,
    @InjectModel("Person") private readonly personModel: Model<PersonDocument>,
    @InjectModel("Round") private readonly roundModel: Model<RoundDocument>,
    @InjectModel("Result") private readonly resultModel: Model<ResultDocument>,
    @InjectModel("Competition") private readonly contestModel: Model<ContestDocument>,
    @InjectModel("User") private readonly userModel: Model<UserDocument>,
  ) {}

  async onModuleInit() {
    if (process.env.NODE_ENV !== "production") {
      const anyPerson = await this.personModel.findOne().exec();

      if (!anyPerson) {
        this.logger.log("Creating test competitors for development...");

        await this.personModel.create({ name: "Test Admin", countryIso2: "CH", personId: 1 });
        await this.personModel.create({ name: "Test Moderator", countryIso2: "NR", personId: 2 });
      }
    }

    if (process.env.DO_DB_CONSISTENCY_CHECKS === "true") {
      this.logger.log("Checking persons inconsistencies in the DB...");

      const persons = await this.personModel.find().exec();

      for (let i = 0; i < persons.length; i++) {
        const person = persons[i];
        const identifier = `${person.name} (CC ID: ${person.personId})`;

        // Look for persons with the same name
        if (persons.some((p, index) => index > i && p.personId !== person.personId && p.name === person.name)) {
          this.logger.error(`Error: multiple persons found with the name ${person.name}`);
        }

        // Look for persons with parentheses in the name
        if (person.name.includes("(") || person.name.includes(")")) {
          this.logger.error(`Error: person has parentheses in the name: ${identifier}`);
        }

        // Look for persons with no results or organized contests and who aren't tied to a user
        // const result = await this.resultModel.findOne({ personIds: person.personId }, { _id: 1 }).exec();
        // if (!result) {
        //   const contest = await this.contestModel.findOne({ organizers: person._id }, { _id: 1 }).exec();
        //   if (!contest) {
        //     const user = await this.userModel.findOne({ personId: person.personId }, { _id: 1 }).exec();
        //     if (!user) {
        //       this.logger.error(
        //         `Error: person has no results or organized contests and isn't tied to a user: ${identifier}`,
        //       );
        //     }
        //   }
        // }
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
          { $lookup: { from: "users", localField: "createdBy", foreignField: "_id", as: "creator" } },
          { $lookup: { from: "people", localField: "creator.personId", foreignField: "personId", as: "crtrPerson" } },
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
          person.creator = "EXT_DEVICE";
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
    const simplifiedParts = getSimplifiedString(name).split(" ");
    const nameQuery = { $and: simplifiedParts.map((part) => ({ name: { $regex: part, $options: "i" } })) };
    const locNameQuery = { $and: simplifiedParts.map((part) => ({ localizedName: { $regex: part, $options: "i" } })) };
    // To-do: replace this with a search that would match by sanitizing the diacritics in the name/localizedName too,
    // so that Lukasz (query) also matches Łukasz (db) without TEMP_QUERY
    const TEMP_QUERY = { name: { $regex: name, $options: "i" } };

    return await this.personModel
      .find({ $or: [nameQuery, locNameQuery, TEMP_QUERY] }, excl)
      .limit(10)
      .exec();
  }

  async getPersonByName(name: string): Promise<IFePerson> {
    return await this.personModel.findOne({ name }, excl).exec();
  }

  async getOrCreatePersonByWcaId(
    wcaId: string,
    { user }: { user: IPartialUser | "EXT_DEVICE" },
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
    contestEvents?: ContestEventModel[];
    unapprovedOnly?: boolean;
  }): Promise<PersonDocument[]> {
    const personIds: number[] = [];
    let compRounds: RoundDocument[] = [];

    if (contestEvents) { for (const compEvent of contestEvents) compRounds.push(...compEvent.rounds); }
    else compRounds = await this.roundModel.find({ competitionId }).populate(resultPopulateOptions).exec();

    for (const round of compRounds) {
      for (const result of round.results) {
        if (!result.personIds) {
          this.logger.error("Round results are not populated");
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
    { user, ignoreDuplicate }: { user: IPartialUser | "EXT_DEVICE"; ignoreDuplicate?: boolean },
  ): Promise<PersonDocument | IFePerson> {
    this.logger.logAndSave(
      `Creating person with name ${personDto.name} and ${personDto.wcaId ? `WCA ID ${personDto.wcaId}` : "no WCA ID"}`,
      LogType.CreatePerson,
    );

    await this.validateAndCleanUpPerson(personDto, {
      ignoreDuplicate,
      isAdmin: user !== "EXT_DEVICE" && user.roles.includes(Role.Admin),
    });

    const [newestPerson] = await this.personModel.find({}, { personId: 1 }).sort({ personId: -1 }).limit(1).exec();
    const createdPerson = await this.personModel.create({
      ...personDto,
      unapproved: true,
      personId: newestPerson ? newestPerson.personId + 1 : 1,
      createdBy: user !== "EXT_DEVICE" ? new mongo.ObjectId(user._id as string) : undefined,
    });

    return this.getFrontendPerson(createdPerson, { user });
  }

  async updatePerson(
    id: string,
    personDto: PersonDto,
    user: IPartialUser,
    { ignoreDuplicate }: { ignoreDuplicate?: boolean } = {},
  ): Promise<IFePerson> {
    this.logger.logAndSave(
      `Updating person with name ${personDto.name} and ${personDto.wcaId ? `WCA ID ${personDto.wcaId}` : "no WCA ID"}`,
      LogType.UpdatePerson,
    );

    const isAdmin = user.roles.includes(Role.Admin);

    await this.validateAndCleanUpPerson(personDto, { excludeId: id, ignoreDuplicate, isAdmin });

    const person = await this.personModel.findById(id).exec();
    if (!person) throw new NotFoundException("Person not found");

    if (!isAdmin && !person.unapproved) {
      throw new BadRequestException("You may not edit a person who has competed in a published contest");
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

    return this.getFrontendPerson(person, { user });
  }

  async deletePerson(id: string) {
    this.logger.logAndSave(`Deleting person with ID ${id}`, LogType.DeletePerson);

    const person = await this.personModel.findById(id).exec();
    if (!person) throw new NotFoundException("Person not found");
    if (!person.unapproved) throw new BadRequestException("You may not delete an approved person");

    const user = await this.userModel.findOne({ personId: person.personId }, { username: 1 }).exec();
    if (user) {
      throw new BadRequestException(
        `You may not delete a person tied to a user. This person is tied to user ${user.username}.`,
      );
    }

    const result = await this.resultModel.findOne({ personIds: person.personId }, { eventId: 1, competitionId: 1 })
      .exec();
    if (result) {
      throw new BadRequestException(
        `You may not delete a person who has a result. This person has a result in ${result.eventId} at ${result.competitionId}.`,
      );
    }

    const organizedContest = await this.contestModel.findOne({ organizers: person._id }, { competitionId: 1 }).exec();
    if (organizedContest) {
      throw new BadRequestException(
        `You may not delete a person who has organized a contest. This person was an organizer at ${organizedContest.competitionId}.`,
      );
    }

    await person.deleteOne();
  }

  async approvePerson(
    { id, personId, skipValidation = false }: {
      id?: string;
      personId?: number;
      skipValidation?: boolean;
    },
  ) {
    const person = id
      ? await this.personModel.findById(id).exec()
      : await this.personModel.findOne({ personId }).exec();
    if (!person) throw new NotFoundException("Person not found");

    if (!skipValidation) {
      if (!person.unapproved) throw new BadRequestException(`${person.name} has already been approved`);

      const result = await this.resultModel.findOne({ personIds: person.personId }, { _id: 1 }).exec();
      if (!result) {
        const organizedContest = await this.contestModel.findOne({ organizers: person._id }).exec();
        if (!organizedContest) {
          throw new BadRequestException(
            `${person.name} has no results and hasn't organized any contests. They could have been added by accident.`,
          );
        }
      }
    }

    await this.setPersonToApproved(person, false);
    return this.getFrontendPerson(person);
  }

  // Returns array of persons who couldn't be approved
  async approvePersons({
    personIds,
    competitionId,
    requireWcaId = false,
  }: {
    personIds?: number[];
    competitionId?: string;
    requireWcaId?: boolean;
  }) {
    const persons = personIds
      ? await this.getPersonsByPersonIds(personIds, { unapprovedOnly: true })
      : await this.getContestParticipants({ competitionId, unapprovedOnly: true });
    const message = competitionId
      ? `Approving unapproved persons from contest with ID ${competitionId}`
      : `Approving persons with person IDs: ${personIds.join(", ")}`;

    this.logger.logAndSave(message, LogType.ApprovePersons);

    await Promise.allSettled(persons.filter((p) => p.unapproved).map((p) => this.setPersonToApproved(p, requireWcaId)));
  }

  private async setPersonToApproved(person: PersonDocument, requireWcaId: boolean) {
    if (!person.wcaId) {
      const res = await fetch(
        `https://www.worldcubeassociation.org/api/v0/search/users?persons_table=true&q=${person.name}`,
      );
      if (res.ok) {
        const { result: wcaPersons } = await res.json();

        if (!requireWcaId) {
          for (const wcaPerson of wcaPersons) {
            const [name] = getNameAndLocalizedName(wcaPerson.name);
            if (name === person.name && wcaPerson.country_iso2 === person.countryIso2) {
              throw new BadRequestException(
                `There is an exact name match with the WCA competitor with WCA ID ${wcaPerson.wca_id}. Check if these are the same person and contact an administrator to approve them if not.`,
              );
            }
          }
        } else if (wcaPersons?.length === 1) {
          const wcaPerson = wcaPersons[0];
          const [name, localizedName] = getNameAndLocalizedName(wcaPerson.name);

          if (name === person.name && wcaPerson.country_iso2 === person.countryIso2) {
            person.wcaId = wcaPerson.wca_id;
            person.localizedName = localizedName;
          }
        }
      }
    }

    if (!requireWcaId || person.wcaId) {
      this.logger.logAndSave(`Approving person ${person.name} (CC ID: ${person.personId})`, LogType.ApprovePersons);

      person.unapproved = undefined;
      await person.save();
    }
  }

  private async validateAndCleanUpPerson(
    personDto: PersonDto,
    { ignoreDuplicate, excludeId, isAdmin }: { ignoreDuplicate?: boolean; excludeId?: string; isAdmin?: boolean } = {},
  ) {
    const queryBase: any = excludeId ? { _id: { $ne: excludeId } } : {};

    if (personDto.wcaId?.trim()) {
      personDto.wcaId = personDto.wcaId.trim().toUpperCase();
      const sameWcaIdPerson = await this.personModel.findOne({ ...queryBase, wcaId: personDto.wcaId }).exec();
      if (sameWcaIdPerson) throw new ConflictException("A person with the same WCA ID already exists");
    }

    if (!ignoreDuplicate) {
      const sameNamePerson = await this.personModel.findOne({
        ...queryBase,
        name: personDto.name,
        countryIso2: personDto.countryIso2,
      }).exec();
      if (sameNamePerson) {
        throw new ConflictException(
          isAdmin
            ? "DUPLICATE_PERSON_ERROR"
            : "A person with the same name and country already exists. If it's actually a different competitor with the same name, please contact the admin team. For now, simply add (2) at the end of their name to do data entry.",
        );
      }
    }
  }

  private getFrontendPerson(person: PersonDocument, { user }: { user?: IPartialUser | "EXT_DEVICE" } = {}): IFePerson {
    const fePerson: IFePerson = person.toObject();

    // Remove system fields
    Object.keys(excl).forEach((key) => delete (fePerson as any)[key]);

    if (user && user !== "EXT_DEVICE") fePerson.creator = { username: user.username, email: "", roles: [] };

    return fePerson;
  }
}
