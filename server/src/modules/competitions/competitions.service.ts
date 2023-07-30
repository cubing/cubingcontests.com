import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { find } from 'geo-tz';
import { getTimezone } from 'countries-and-timezones';
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
import { setNewRecords } from '@sh/sharedFunctions';
import { CompetitionState, WcaRecordType } from '@sh/enums';
import { Role } from '~/src/helpers/enums';

interface ICompetitionUpdateResult {
  events: ICompetitionEvent[];
  participants: number;
}

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
  ) {}

  async getCompetitions(region?: string): Promise<CompetitionDocument[]> {
    const queryFilter: any = region ? { countryId: region } : {};
    queryFilter.state = { $gt: CompetitionState.Created };

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

    if (competition?.state > CompetitionState.Created) {
      const output: ICompetitionData = {
        competition,
        events: [],
        persons: [],
        timezoneOffset: getTimezone(find(competition.latitude, competition.longitude)[0]).dstOffset,
      };

      // Get information about all participants and events of the competition if the results have been posted
      try {
        if (competition.state >= CompetitionState.Ongoing) {
          const personIds: number[] = this.getCompetitionParticipants(competition.events);
          output.persons = await this.personsService.getPersonsById(personIds);
        }

        const eventIds = output.competition.events.map((el) => el.eventId);
        output.events = await this.eventsService.getEvents(eventIds);
      } catch (err) {
        throw new InternalServerErrorException(err.message);
      }

      return output;
    }

    throw new NotFoundException(`Competition with id ${competitionId} not found`);
  }

  async getModCompetition(competitionId: string): Promise<ICompetitionModData> {
    const competition = await this.getFullCompetition(competitionId);
    const events = await this.eventsService.getEvents();
    const personIds: number[] = this.getCompetitionParticipants(competition.events);

    if (competition) {
      const compModData: ICompetitionModData = {
        competition,
        events,
        persons: await this.personsService.getPersonsById(personIds),
        // This is DIFFERENT from the output of getEventRecords(), because this holds records for ALL events
        records: {} as any,
      };
      const activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });

      // Get all current records
      for (const event of events) {
        compModData.records[event.eventId] = await this.getEventRecords(
          event.eventId,
          activeRecordTypes,
          new Date(competition.startDate),
        );
      }

      return compModData;
    }

    throw new NotFoundException(`Competition with id ${competitionId} not found`);
  }

  // Create new competition, if one with that id doesn't already exist (no results yet)
  async createCompetition(createCompetitionDto: CreateCompetitionDto, creatorPersonId: number) {
    let comp;
    try {
      comp = await this.competitionModel.findOne({ competitionId: createCompetitionDto.competitionId }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (comp) throw new BadRequestException(`Competition with id ${createCompetitionDto.competitionId} already exists`);

    try {
      // First save all of the rounds in the DB (without any results until they get posted)
      const competitionEvents: CompetitionEvent[] = [];

      for (const event of createCompetitionDto.events) {
        const eventRounds: RoundDocument[] = [];

        for (const round of event.rounds) {
          eventRounds.push(await this.roundModel.create(round));
        }

        competitionEvents.push({ ...event, rounds: eventRounds });
      }

      // Create new competition
      const newCompetition = {
        ...createCompetitionDto,
        events: competitionEvents,
        createdBy: creatorPersonId,
        state: CompetitionState.Created,
      } as ICompetition;

      if (createCompetitionDto.organizers) {
        newCompetition.organizers = await this.personsService.getPersonsById(
          createCompetitionDto.organizers.map((org) => org.personId),
        );
      }

      await this.competitionModel.create(newCompetition);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // Update the competition. This is also used for posting results.
  async updateCompetition(competitionId: string, updateCompetitionDto: UpdateCompetitionDto, roles: Role[]) {
    let comp: CompetitionDocument;
    try {
      comp = await this.competitionModel.findOne({ competitionId }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!comp) throw new BadRequestException(`Competition with id ${competitionId} not found`);

    const isAdmin = roles.includes(Role.Admin);

    // Only an admin is allowed to edit these fields
    if (isAdmin) {
      if (updateCompetitionDto.competitionId) comp.competitionId = updateCompetitionDto.competitionId;
      if (updateCompetitionDto.countryId) comp.countryId = updateCompetitionDto.countryId;
      if (updateCompetitionDto.state) comp.state = updateCompetitionDto.state;
    }
    // Allow only finishing a competition for mods
    else if (updateCompetitionDto.state === CompetitionState.Finished && comp.state === CompetitionState.Ongoing) {
      comp.state = updateCompetitionDto.state;
    }

    if (isAdmin || comp.state < CompetitionState.Finished) {
      if (updateCompetitionDto.organizers)
        comp.organizers = await this.personsService.getPersonsById(
          updateCompetitionDto.organizers.map((org) => org.personId),
        );
      if (updateCompetitionDto.contact) comp.contact = updateCompetitionDto.contact;
      if (updateCompetitionDto.description) comp.description = updateCompetitionDto.description;
    }

    if (isAdmin || comp.state < CompetitionState.Ongoing) {
      if (updateCompetitionDto.name) comp.name = updateCompetitionDto.name;
      if (updateCompetitionDto.city) comp.city = updateCompetitionDto.city;
      if (updateCompetitionDto.venue) comp.venue = updateCompetitionDto.venue;
      if (updateCompetitionDto.latitude && updateCompetitionDto.longitude) {
        comp.latitude = updateCompetitionDto.latitude;
        comp.longitude = updateCompetitionDto.longitude;
      }
      if (updateCompetitionDto.startDate) comp.startDate = updateCompetitionDto.startDate;
      if (updateCompetitionDto.endDate) comp.endDate = updateCompetitionDto.endDate;
      if (updateCompetitionDto.competitorLimit) comp.competitorLimit = updateCompetitionDto.competitorLimit;
      if (updateCompetitionDto.mainEventId) comp.mainEventId = updateCompetitionDto.mainEventId;
    }

    // Post competition results and set the number of participants
    if (
      updateCompetitionDto.state === CompetitionState.Ongoing &&
      [CompetitionState.Approved, CompetitionState.Ongoing].includes(comp.state)
    ) {
      // Store the results temporarily in case there is an error
      let tempResults: IResult[];

      try {
        tempResults = (await this.resultModel.find({ competitionId }).exec()) as IResult[];
        await this.resultModel.deleteMany({ competitionId }).exec();

        const activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });

        comp.participants = (
          await this.updateCompetitionEvents(updateCompetitionDto.events, activeRecordTypes)
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
    }

    try {
      await comp.save();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /////////////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////////////

  // Finds the competition with the given competition id with the rounds and results populated
  private async getFullCompetition(competitionId: string): Promise<CompetitionDocument> {
    try {
      return await this.competitionModel
        .findOne(
          { competitionId },
          {
            ...excl,
            createdBy: 0,
          },
        )
        .populate({
          path: 'events.rounds',
          model: 'Round',
          populate: [
            {
              path: 'results',
              model: 'Result',
            },
          ],
        })
        .populate({ path: 'organizers', model: 'Person' })
        .exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
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
      // personId can have multiple ids separated by ; so all ids need to be checked
      for (const personId of result.personId.split(';').map((el) => parseInt(el))) {
        if (!personIds.includes(personId)) {
          personIds.push(personId);
        }
      }
    }
  }

  // Assumes that all records in newCompEvents have been reset (because they need to be set from scratch)
  async updateCompetitionEvents(
    newCompEvents: ICompetitionEvent[],
    activeRecordTypes: IRecordType[],
  ): Promise<ICompetitionUpdateResult> {
    // output.events is for automated tests
    const output: ICompetitionUpdateResult = { participants: 0, events: [] };
    const personIds: number[] = []; // used for calculating the number of participants

    // Save all results from every event and set new records, if there are any
    for (const event of newCompEvents) {
      const eventRounds: IRound[] = [];
      let sameDayRounds: IRound[] = [];
      // These are set to null if there are no active record types
      const records: any = await this.getEventRecords(event.eventId, activeRecordTypes);
      event.rounds.sort((a: IRound, b: IRound) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (const round of event.rounds) {
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
      output.events.push({ ...event, rounds: eventRounds });
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
    else
      beforeDate = new Date(Date.UTC(beforeDate.getUTCFullYear(), beforeDate.getUTCMonth(), beforeDate.getUTCDate()));

    const records: any = {};

    // Go through all active record types
    for (const rt of activeRecordTypes) {
      const newRecords = { best: -1, average: -1 };

      const singleResults = await this.resultsService.getEventSingleRecordResults(eventId, rt.label, beforeDate);
      if (singleResults.length > 0) newRecords.best = singleResults[0].best;

      const avgResults = await this.resultsService.getEventAverageRecordResults(eventId, rt.label, beforeDate);
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
        sameDayRounds = setNewRecords(sameDayRounds, records[rt.wcaEquivalent], rt.label, true);
      }
    }

    // Save results in the DB
    try {
      for (const round of sameDayRounds) {
        const newResults = await this.resultModel.create(round.results);

        await this.roundModel
          .updateOne(
            { competitionId: round.competitionId, eventId: round.eventId, roundTypeId: round.roundTypeId },
            { $set: { results: newResults } },
          )
          .exec();
      }
    } catch (err) {
      throw new InternalServerErrorException(`Error while creating rounds: ${err.message}`);
    }

    return sameDayRounds;
  }
}
