import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompetitionEvent, CompetitionDocument } from '~/src/models/competition.model';
import { excl } from '~/src/helpers/dbHelpers';
import { Round, RoundDocument } from '~/src/models/round.model';
import { RecordTypeDocument } from '~/src/models/record-type.model';
import { ResultDocument } from '~/src/models/result.model';
import { ResultsService } from '@m/results/results.service';
import { EventsService } from '@m/events/events.service';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { PersonsService } from '@m/persons/persons.service';
import { ICompetitionEvent, ICompetitionData, ICompetitionModData, IRound, IResult } from '@sh/interfaces';
import { setNewRecords } from '@sh/sharedFunctions';
import { WcaRecordType } from '@sh/enums';

interface CompetitionUpdateResult {
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
    @InjectModel('Result') private readonly resultModel: Model<ResultDocument>, // @InjectModel('Person') private readonly personModel: Model<PersonDocument>,
  ) {}

  async getCompetitions(region?: string): Promise<CompetitionDocument[]> {
    const queryFilter = region ? { country: region } : {};

    try {
      return await this.competitionModel.find(queryFilter, excl).sort({ startDate: -1 }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getCompetition(competitionId: string): Promise<ICompetitionData> {
    const competition = await this.getFullCompetition(competitionId);

    if (competition) {
      const output: ICompetitionData = {
        competition,
        events: [],
        persons: [],
      };

      // Get information about all participants and events of the competition if the results have been posted
      if (competition.events.length > 0) {
        try {
          const personIds: number[] = this.getCompetitionParticipants(competition.events);
          output.persons = await this.personsService.getPersonsById(personIds);

          const eventIds = output.competition.events.map((el) => el.eventId);
          output.events = await this.eventsService.getEvents(eventIds);
        } catch (err) {
          throw new InternalServerErrorException(err.message);
        }
      }

      return output;
    }

    throw new NotFoundException(`Competition with id ${competitionId} not found`);
  }

  async getModCompetition(competitionId: string): Promise<ICompetitionModData> {
    const competition = await this.getFullCompetition(competitionId);
    const events = await this.eventsService.getEvents();
    const personIds: number[] = this.getCompetitionParticipants(competition.events);
    const persons = await this.personsService.getPersonsById(personIds);

    if (competition) {
      const output: ICompetitionModData = {
        competition,
        events,
        persons,
        // This is DIFFERENT from the output of getEventRecords(), because this holds records for ALL events
        records: {} as any,
      };
      const activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });

      // Get all current records
      for (const event of events) {
        output.records[event.eventId] = await this.getEventRecords(
          event.eventId,
          activeRecordTypes,
          new Date(competition.startDate),
        );
      }

      return output;
    }

    throw new NotFoundException(`Competition with id ${competitionId} not found`);
  }

  // Create new competition, if one with that id doesn't already exist (no results yet)
  async createCompetition(createCompetitionDto: CreateCompetitionDto) {
    let comp;
    try {
      comp = await this.competitionModel.findOne({ competitionId: createCompetitionDto.competitionId }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (comp) throw new BadRequestException(`Competition with id ${createCompetitionDto.competitionId} already exists`);

    try {
      await this.competitionModel.create(createCompetitionDto);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // Update the competition. This is also used for posting results.
  async updateCompetition(competitionId: string, updateCompetitionDto: UpdateCompetitionDto) {
    let comp: CompetitionDocument;
    try {
      comp = await this.competitionModel.findOne({ competitionId }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!comp) throw new BadRequestException(`Competition with id ${competitionId} not found`);

    if (updateCompetitionDto.name) comp.name = updateCompetitionDto.name;
    if (updateCompetitionDto.type) comp.type = updateCompetitionDto.type;
    if (updateCompetitionDto.city) comp.city = updateCompetitionDto.city;
    if (updateCompetitionDto.countryId) comp.countryId = updateCompetitionDto.countryId;
    if (updateCompetitionDto.startDate) comp.startDate = updateCompetitionDto.startDate;
    if (updateCompetitionDto.endDate) comp.endDate = updateCompetitionDto.endDate;
    if (updateCompetitionDto.description) comp.description = updateCompetitionDto.description;
    if (updateCompetitionDto.mainEventId) comp.mainEventId = updateCompetitionDto.mainEventId;

    // Post competition results
    if (updateCompetitionDto.events.length > 0) {
      let tempRounds: IRound[];
      let tempResults: IResult[];

      if (comp.events.length > 0) {
        console.log('Rewriting existing competition results');

        // Store the rounds and results temporarily in case
        tempRounds = (await this.roundModel.find({ competitionId }).exec()) as IRound[];
        tempResults = (await this.resultModel.find({ competitionId }).exec()) as IResult[];
        await this.roundModel.deleteMany({ competitionId }).exec();
        await this.resultModel.deleteMany({ competitionId }).exec();
      }

      try {
        const updatedCompetition: CompetitionUpdateResult = await this.updateCompetitionEvents(
          updateCompetitionDto.events,
        );
        comp.events = updatedCompetition.events;
        comp.participants = updatedCompetition.participants;
      } catch (err: any) {
        // Add back the rounds and results if there was an error while creating the competition
        if (tempRounds) await this.roundModel.create(tempRounds);
        if (tempResults) await this.resultModel.create(tempResults);
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
        .findOne({ competitionId }, excl)
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
  async updateCompetitionEvents(newCompEvents: ICompetitionEvent[]): Promise<CompetitionUpdateResult> {
    const output = { events: [] } as CompetitionUpdateResult;
    const activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });
    const personIds: number[] = []; // used for calculating the number of participants

    // Save every round from every event
    for (const event of newCompEvents) {
      const newCompEvent: CompetitionEvent = { eventId: event.eventId, rounds: [] };
      let sameDayRounds: IRound[] = [];
      // These are set to null if there are no active record types
      const records: any = await this.getEventRecords(event.eventId, activeRecordTypes);
      event.rounds.sort((a: IRound, b: IRound) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (const round of event.rounds) {
        if (activeRecordTypes.length > 0) {
          // Set the records from the last day, when the day changes
          if (sameDayRounds.length > 0 && round.date !== sameDayRounds[0].date) {
            newCompEvent.rounds.push(...(await this.setRecords(sameDayRounds, activeRecordTypes, records)));
            sameDayRounds = [];
          }
          sameDayRounds.push(round);
        }

        this.getParticipantsInRound(round, personIds);
      }
      // Set the records for the last day of rounds
      newCompEvent.rounds.push(...(await this.setRecords(sameDayRounds, activeRecordTypes, records)));
      output.events.push(newCompEvent);
    }

    output.participants = personIds.length;
    return output;
  }

  async getEventRecords(
    eventId: string,
    activeRecordTypes: RecordTypeDocument[],
    // beforeDate = new Date(8640000000000000), // max date as default
    // Crazy high date as default (to allow adding 3 hours below (TEMPORARY))
    beforeDate = new Date(8600000000000000),
  ) {
    // Returns null if no record types are active
    if (activeRecordTypes.length === 0) return null;

    // Get the given date at midnight to compare the dates only
    beforeDate = new Date(beforeDate.getUTCFullYear(), beforeDate.getUTCMonth(), beforeDate.getUTCDate(), 3);
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
  async setRecords(sameDayRounds: IRound[], activeRecordTypes: RecordTypeDocument[], records: any): Promise<Round[]> {
    const rounds: Round[] = [];

    for (const rt of activeRecordTypes) {
      // TO-DO: REMOVE HARD CODING TO WR!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      if (rt.active && rt.wcaEquivalent === WcaRecordType.WR) {
        sameDayRounds = setNewRecords(sameDayRounds, records[rt.wcaEquivalent], rt.label, true);

        // Create new results and rounds
        for (const round of sameDayRounds) {
          const newRound = { ...round, results: [] } as Round;

          try {
            newRound.results.push(...(await this.resultModel.create(round.results)));
          } catch (err) {
            throw new InternalServerErrorException(`Error while creating result ${round.results}: ${err.message}`);
          }

          rounds.push(await this.roundModel.create(newRound));
        }
      }
    }

    return rounds;
  }
}
