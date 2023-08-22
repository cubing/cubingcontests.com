import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { find } from 'geo-tz';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompetitionEvent, CompetitionDocument } from '~/src/models/competition.model';
import { excl } from '~/src/helpers/dbHelpers';
import { RoundDocument } from '~/src/models/round.model';
import { ResultDocument } from '~/src/models/result.model';
import { ResultsService } from '@m/results/results.service';
import { EventsService } from '@m/events/events.service';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { PersonsService } from '@m/persons/persons.service';
import {
  ICompetitionEvent,
  ICompetitionData,
  ICompetitionModData,
  IRound,
  IResult,
  IRecordType,
  ICompetition,
} from '@sh/interfaces';
import { getDateOnly, setNewRecords } from '@sh/sharedFunctions';
import { CompetitionState, CompetitionType, WcaRecordType } from '@sh/enums';
import { Role } from '~/src/helpers/enums';
import { ScheduleDocument } from '~/src/models/schedule.model';

interface ICompetitionUpdateResult {
  events: ICompetitionEvent[];
  participants: number;
}

const eventPopulateOptions = {
  event: { path: 'events.event', model: 'Event' },
  rounds: {
    path: 'events.rounds',
    model: 'Round',
    populate: [
      {
        path: 'results',
        model: 'Result',
      },
    ],
  },
};

@Injectable()
export class CompetitionsService {
  constructor(
    private eventsService: EventsService,
    private resultsService: ResultsService,
    private recordTypesService: RecordTypesService,
    private personsService: PersonsService,
    @InjectModel('Competition') private readonly competitionModel: Model<CompetitionDocument>,
    @InjectModel('Round') private readonly roundModel: Model<RoundDocument>,
    @InjectModel('Result') private readonly resultModel: Model<ResultDocument>,
    @InjectModel('Schedule') private readonly scheduleModel: Model<ScheduleDocument>,
  ) {}

  async onModuleInit() {
    const results = await this.resultModel.find();

    for (const r of results) {
      if (r.personId) {
        const personIds = r.personId.split(';').map((el: string) => parseInt(el));

        console.log('Changing ID from', r.personId, 'to', personIds);

        r.personId = undefined;
        r.personIds = personIds;
        console.log(r);
        await r.save();
      }
    }
  }

  async getCompetitions(region?: string): Promise<CompetitionDocument[]> {
    const queryFilter: any = {
      state: { $gt: CompetitionState.Created },
    };

    if (region) queryFilter.countryIso2 = region;

    try {
      const competitions = await this.competitionModel
        .find(queryFilter, {
          ...excl,
          createdBy: 0,
        })
        .sort({ startDate: -1 })
        .exec();

      return competitions;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getModCompetitions(userId: number, roles: Role[]): Promise<ICompetition[]> {
    try {
      if (roles.includes(Role.Admin)) {
        return await this.competitionModel.find({}, excl).sort({ startDate: -1 }).exec();
      } else {
        return await this.competitionModel
          .find(
            { createdBy: userId },
            {
              ...excl,
              createdBy: 0,
            },
          )
          .sort({ startDate: -1 })
          .exec();
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getCompetition(competitionId: string): Promise<ICompetitionData> {
    const competition = await this.getFullCompetition(competitionId);

    // TEMPORARILY DISABLED until mod-only protection is added
    // if (competition?.state > CompetitionState.Created) {
    if (competition) {
      const output: ICompetitionData = {
        competition,
        persons: [],
        activeRecordTypes: await this.recordTypesService.getRecordTypes({ active: true }),
      };

      // Get information about all participants and events of the competition if the results have been posted
      try {
        if (competition.state >= CompetitionState.Ongoing) {
          const personIds: number[] = this.getCompetitionParticipants(competition.events);
          output.persons = await this.personsService.getPersonsById(personIds);
        }
      } catch (err) {
        throw new InternalServerErrorException(err.message);
      }

      return output;
    }

    throw new NotFoundException(`Competition with id ${competitionId} not found`);
  }

  async getModCompetition(competitionId: string): Promise<ICompetitionModData> {
    const competition = await this.getFullCompetition(competitionId);
    const personIds: number[] = this.getCompetitionParticipants(competition.events);
    const activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });

    if (competition) {
      const compModData: ICompetitionModData = {
        competition,
        persons: await this.personsService.getPersonsById(personIds),
        // This is DIFFERENT from the output of getEventRecords(), because this holds records for ALL events
        records: {} as any,
        activeRecordTypes,
      };

      // Get current records for this competition's events
      for (const compEvent of competition.events) {
        compModData.records[compEvent.event.eventId] = await this.getEventRecords(
          compEvent.event.eventId,
          activeRecordTypes,
          new Date(competition.startDate),
        );
      }

      return compModData;
    }

    throw new NotFoundException(`Competition with id ${competitionId} not found`);
  }

  // Create new competition, if one with that id doesn't already exist (no results yet)
  async createCompetition(createCompDto: CreateCompetitionDto, creatorPersonId: number) {
    let comp;
    try {
      comp = await this.competitionModel.findOne({ competitionId: createCompDto.competitionId }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (comp) throw new BadRequestException(`Competition with id ${createCompDto.competitionId} already exists`);

    try {
      // First save all of the rounds in the DB (without any results until they get posted)
      const competitionEvents: CompetitionEvent[] = [];

      for (const compEvent of createCompDto.events) {
        competitionEvents.push(await this.getNewCompetitionEvent(compEvent));
      }

      // Create new competition
      const newCompetition: ICompetition = {
        ...createCompDto,
        events: competitionEvents,
        createdBy: creatorPersonId,
        state: CompetitionState.Created,
        participants: 0,
      };

      if (createCompDto.organizers) {
        newCompetition.organizers = await this.personsService.getPersonsById(
          createCompDto.organizers.map((org) => org.personId),
        );
      }

      if (createCompDto.type === CompetitionType.Meetup) {
        newCompetition.timezone = find(
          createCompDto.latitudeMicrodegrees / 1000000,
          createCompDto.longitudeMicrodegrees / 1000000,
        )[0];
      } else {
        newCompetition.compDetails.schedule = await this.scheduleModel.create(createCompDto.compDetails.schedule);
      }

      await this.competitionModel.create(newCompetition);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateCompetition(competitionId: string, updateCompetitionDto: UpdateCompetitionDto, roles: Role[]) {
    const comp = await this.findCompetition(competitionId, true);
    const isAdmin = roles.includes(Role.Admin);

    // Only an admin is allowed to edit these fields
    if (isAdmin) {
      comp.competitionId = updateCompetitionDto.competitionId;
      comp.countryIso2 = updateCompetitionDto.countryIso2;
    }

    if (isAdmin || comp.state < CompetitionState.Finished) {
      if (updateCompetitionDto.contact) comp.contact = updateCompetitionDto.contact;
      if (updateCompetitionDto.description) comp.description = updateCompetitionDto.description;

      comp.events = await this.updateCompetitionEvents(comp.events, updateCompetitionDto.events);
    }

    if (isAdmin || comp.state < CompetitionState.Ongoing) {
      comp.name = updateCompetitionDto.name;
      comp.city = updateCompetitionDto.city;
      comp.venue = updateCompetitionDto.venue;
      if (updateCompetitionDto.address) comp.address = updateCompetitionDto.address;
      if (updateCompetitionDto.latitudeMicrodegrees && updateCompetitionDto.longitudeMicrodegrees) {
        comp.latitudeMicrodegrees = updateCompetitionDto.latitudeMicrodegrees;
        comp.longitudeMicrodegrees = updateCompetitionDto.longitudeMicrodegrees;
      }
      comp.startDate = updateCompetitionDto.startDate;
      if (updateCompetitionDto.organizers) {
        comp.organizers = await this.personsService.getPersonsById(
          updateCompetitionDto.organizers.map((org) => org.personId),
        );
      }
      if (updateCompetitionDto.competitorLimit) comp.competitorLimit = updateCompetitionDto.competitorLimit;
      comp.mainEventId = updateCompetitionDto.mainEventId;
      if (updateCompetitionDto.compDetails) {
        // comp.compDetails.schedule = updateCompetitionDto.compDetails.schedule;
      }
    }

    await this.saveCompetition(comp);
  }

  async updateState(competitionId: string, newState: CompetitionState, roles: Role[]) {
    const comp = await this.findCompetition(competitionId);

    if (
      roles.includes(Role.Admin) ||
      // Allow mods only to finish an ongoing competition
      (comp.state === CompetitionState.Ongoing && newState === CompetitionState.Finished)
    ) {
      comp.state = newState;

      if (newState === CompetitionState.Published) {
        console.log(`Publishing competition ${comp.competitionId}`);

        try {
          await this.roundModel.updateMany({ competitionId: comp.competitionId }, { $unset: { compNotPublished: '' } });
          await this.resultModel.updateMany(
            { competitionId: comp.competitionId },
            { $unset: { compNotPublished: '' } },
          );
        } catch (err) {
          throw new InternalServerErrorException(`Error while publishing competition: ${err.message}`);
        }
      }
    }

    await this.saveCompetition(comp);
  }

  async postResults(competitionId: string, updateCompetitionDto: UpdateCompetitionDto) {
    const comp = await this.findCompetition(competitionId);

    if (comp.state < CompetitionState.Approved) {
      throw new BadRequestException("You may not post the results for a competition that hasn't been approved");
    } else if (comp.state >= CompetitionState.Finished) {
      throw new BadRequestException('You may not post the results for a finished competition');
    }

    // Store the results temporarily in case there is an error
    let tempResults: IResult[];

    try {
      tempResults = (await this.resultModel.find({ competitionId }).exec()) as IResult[];
      await this.resultModel.deleteMany({ competitionId }).exec();

      const activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });

      comp.participants = (
        await this.updateCompetitionResults(updateCompetitionDto.events, activeRecordTypes)
      ).participants;
      comp.state = CompetitionState.Ongoing;
    } catch (err) {
      // Reset the results if there was an error while posting the results
      if (tempResults?.length > 0) {
        await this.resultModel.deleteMany({ competitionId }).exec();
        await this.resultModel.create(tempResults);
      }

      throw new InternalServerErrorException(`Error while updating competition events: ${err.message}`);
    }

    await this.saveCompetition(comp);
  }

  /////////////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////////////

  private async findCompetition(competitionId: string, populateEvents = false): Promise<CompetitionDocument> {
    let competition: CompetitionDocument;

    try {
      if (!populateEvents) {
        competition = await this.competitionModel.findOne({ competitionId }).exec();
      } else {
        competition = await this.competitionModel
          .findOne({ competitionId })
          .populate(eventPopulateOptions.event)
          .populate(eventPopulateOptions.rounds)
          .exec();
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (!competition) throw new NotFoundException(`Competition with id ${competitionId} not found`);

    return competition;
  }

  private async saveCompetition(competition: CompetitionDocument) {
    try {
      await competition.save();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // Finds the competition with the given competition id with the rounds and results populated
  private async getFullCompetition(competitionId: string): Promise<CompetitionDocument> {
    try {
      const competition: CompetitionDocument = await this.competitionModel
        .findOne(
          { competitionId },
          {
            ...excl,
            createdBy: 0,
          },
        )
        .populate(eventPopulateOptions.event)
        .populate(eventPopulateOptions.rounds)
        .populate({ path: 'organizers', model: 'Person' })
        .exec();

      if (competition.compDetails) {
        await competition.populate({ path: 'compDetails.schedule', model: 'Schedule' });
      }

      return competition;
    } catch (err) {
      throw new NotFoundException(err.message);
    }
  }

  private async getNewCompetitionEvent(compEvent: ICompetitionEvent): Promise<CompetitionEvent> {
    const eventRounds: RoundDocument[] = [];

    for (const round of compEvent.rounds) eventRounds.push(await this.roundModel.create(round));

    return {
      event: await this.eventsService.getEventById(compEvent.event.eventId),
      rounds: eventRounds,
    };
  }

  // This method must only be called when the event rounds have been populated
  private getCompetitionParticipants(events: ICompetitionEvent[]): number[] {
    const personIds: number[] = [];
    for (const event of events) {
      for (const round of event.rounds) this.getParticipantsInRound(round, personIds);
    }
    return personIds;
  }

  // Adds new unique participants to the personIds array
  private getParticipantsInRound(round: IRound, personIds: number[]): void {
    for (const result of round.results) {
      for (const personId of result.personIds) {
        if (!personIds.includes(personId)) personIds.push(personId);
      }
    }
  }

  private async updateCompetitionEvents(
    compEvents: CompetitionEvent[],
    newEvents: ICompetitionEvent[],
  ): Promise<CompetitionEvent[]> {
    // Remove deleted rounds and events
    for (const compEvent of compEvents) {
      const sameEventInNew = newEvents.find((el) => el.event.eventId === compEvent.event.eventId);

      if (sameEventInNew) {
        for (const round of compEvent.rounds) {
          if (!sameEventInNew.rounds.some((el) => (el as RoundDocument)._id.toString() === round._id.toString())) {
            // Delete round if it has no results
            if (round.results.length === 0) {
              await this.roundModel.deleteOne({ _id: round._id });
              compEvent.rounds = compEvent.rounds.filter((el) => el !== round);
            }
          }
        }
      }
      // Delete event and all of its rounds if it has no results
      else if (!compEvent.rounds.some((el) => el.results.length > 0)) {
        await this.roundModel.deleteMany({ _id: { $in: compEvent.rounds.map((el) => el._id) } });
        compEvents = compEvents.filter((el) => el.event.eventId !== compEvent.event.eventId);
      }
    }

    // Update rounds and add new events
    for (const newEvent of newEvents) {
      const sameEventInComp = compEvents.find((el) => el.event.eventId === newEvent.event.eventId);

      if (sameEventInComp) {
        for (const round of newEvent.rounds) {
          const sameRoundInComp = sameEventInComp.rounds.find(
            (el) => el._id.toString() === (round as RoundDocument)._id.toString(),
          );

          if (sameRoundInComp) {
            // Update round
            const updateObj: any = { $set: { roundTypeId: round.roundTypeId } };

            if (sameRoundInComp.results.length === 0) updateObj.$set.format = round.format;

            // Update proceed object if the updated round has it and the round has no results
            // or set it, if the round previously had no proceed object (meaning it was the final round)
            if (round.proceed) {
              if (sameRoundInComp.results.length === 0 || !sameRoundInComp.proceed)
                updateObj.$set.proceed = round.proceed;
            } else if (sameRoundInComp.proceed) {
              // Unset proceed object if it got deleted (the round became the final round due to a deletion)
              updateObj.$unset = { proceed: '' };
            }

            await this.roundModel.updateOne({ _id: (round as RoundDocument)._id }, updateObj).exec();
          } else {
            // Add new round
            sameEventInComp.rounds.push(await this.roundModel.create(round));
          }
        }
      } else {
        compEvents.push(await this.getNewCompetitionEvent(newEvent));
      }
    }

    compEvents.sort((a, b) => a.event.rank - b.event.rank);

    return compEvents;
  }

  // Assumes that all records in newCompEvents have been reset (because they need to be set from scratch)
  async updateCompetitionResults(
    newCompEvents: ICompetitionEvent[],
    activeRecordTypes: IRecordType[],
  ): Promise<ICompetitionUpdateResult> {
    // output.events is for automated tests
    const output: ICompetitionUpdateResult = { participants: 0, events: [] };
    const personIds: number[] = []; // used for calculating the number of participants

    // Save all results from every event and set new records, if there are any
    for (const compEvent of newCompEvents) {
      const eventRounds: IRound[] = [];
      let sameDayRounds: IRound[] = [];
      // These are set to null if there are no active record types
      const records: any = await this.getEventRecords(compEvent.event.eventId, activeRecordTypes);
      compEvent.rounds.sort((a: IRound, b: IRound) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (const round of compEvent.rounds) {
        // Set the records from the last day, when the day changes
        if (sameDayRounds.length > 0 && round.date !== sameDayRounds[0].date) {
          eventRounds.push(...(await this.setRecordsAndSaveResults(sameDayRounds, activeRecordTypes, records)));
          sameDayRounds = [];
        }
        sameDayRounds.push(round);

        this.getParticipantsInRound(round, personIds);
      }

      // Set the records for the last day of rounds
      eventRounds.push(...(await this.setRecordsAndSaveResults(sameDayRounds, activeRecordTypes, records)));
      output.events.push({ ...compEvent, rounds: eventRounds });
    }

    output.participants = personIds.length;
    return output;
  }

  async getEventRecords(
    eventId: string,
    activeRecordTypes: IRecordType[],
    beforeDate: Date = null, // max date as default
  ) {
    // Returns null if no record types are active
    if (activeRecordTypes.length === 0) return null;

    // If a date wasn't passed, use max date, otherwise use the passed date at midnight to compare just the dates
    if (!beforeDate) beforeDate = new Date(8640000000000000);
    else beforeDate = getDateOnly(beforeDate);

    const records: any = {};

    // Go through all active record types
    for (const rt of activeRecordTypes) {
      const newRecords = { best: -1, average: -1 };

      const singleResults = await this.resultsService.getEventSingleRecordResults(
        eventId,
        rt.wcaEquivalent,
        beforeDate,
      );
      if (singleResults.length > 0) newRecords.best = singleResults[0].best;

      const avgResults = await this.resultsService.getEventAverageRecordResults(eventId, rt.wcaEquivalent, beforeDate);
      if (avgResults.length > 0) newRecords.average = avgResults[0].average;

      records[rt.wcaEquivalent] = newRecords;
    }

    return records;
  }

  // Sets the newly-set records in sameDayRounds using the information from records
  // (but only the active record types) and returns the rounds
  async setRecordsAndSaveResults(
    sameDayRounds: IRound[],
    activeRecordTypes: IRecordType[],
    records: any,
  ): Promise<IRound[]> {
    // Set records
    for (const rt of activeRecordTypes) {
      // TO-DO: REMOVE HARD CODING TO WR!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      if (rt.active && rt.wcaEquivalent === WcaRecordType.WR) {
        sameDayRounds = setNewRecords(sameDayRounds, records[rt.wcaEquivalent], rt.wcaEquivalent, true);
      }
    }

    // Save results in the DB
    try {
      for (const round of sameDayRounds) {
        const newResults = await this.resultModel.create(round.results);

        await this.roundModel
          .updateOne({ _id: (round as RoundDocument)._id }, { $set: { results: newResults } })
          .exec();
      }
    } catch (err) {
      throw new Error(`Error while creating rounds: ${err.message}`);
    }

    return sameDayRounds;
  }
}
