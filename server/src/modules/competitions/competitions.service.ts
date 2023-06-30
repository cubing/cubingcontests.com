import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Competition, CompetitionEvent, CompetitionDocument } from '~/src/models/competition.model';
import { Round, RoundDocument } from '~/src/models/round.model';
import { Event } from '~/src/models/event.model';
import { Person } from '~/src/models/person.model';
import { excl } from '~/src/helpers/dbHelpers';
import { RecordTypeDocument } from '~/src/models/record-type.model';
import { RecordTypesService } from '~/src/modules/record-types/record-types.service';
import { ICompetitionData, ICompetitionEvent } from '@sh/interfaces/Competition';
import IRound from '@sh/interfaces/Round';

@Injectable()
export class CompetitionsService {
  constructor(
    @InjectModel('Competition') private readonly competitionModel: Model<Competition>,
    @InjectModel('Round') private readonly roundModel: Model<RoundDocument>,
    @InjectModel('Event') private readonly eventModel: Model<Event>,
    @InjectModel('Person') private readonly personModel: Model<Person>,
    private recordTypesService: RecordTypesService,
  ) {}

  async getCompetitions(region?: string): Promise<CompetitionDocument[]> {
    let queryFilter = region ? { country: region } : {};

    try {
      return await this.competitionModel.find(queryFilter, excl).sort({ startDate: -1 }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getCompetition(competitionId: string): Promise<ICompetitionData> {
    // Find the competition with the rounds populated
    let competition;
    try {
      competition = await this.competitionModel.findOne({ competitionId }, excl).populate('events.rounds').exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (competition) {
      const output: ICompetitionData = {
        competition,
        eventsInfo: [],
        persons: [],
      };

      // Get information about all participants and events of the competition if the results have been posted
      if (competition.events.length > 0) {
        try {
          const personIds: number[] = this.getCompetitionParticipants(competition.events);
          output.persons = await this.personModel.find({ personId: { $in: personIds } }, excl).exec();

          const eventIds = output.competition.events.map((el) => el.eventId);
          output.eventsInfo = await this.eventModel
            .find({ eventId: { $in: eventIds } }, excl)
            .sort({ rank: 1 })
            .exec();
        } catch (err) {
          throw new InternalServerErrorException(err.message);
        }
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
      const newCompetition: CompetitionDocument = new this.competitionModel(createCompetitionDto);
      await newCompetition.save();
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
    if (updateCompetitionDto.city) comp.city = updateCompetitionDto.city;
    if (updateCompetitionDto.countryId) comp.countryId = updateCompetitionDto.countryId;
    if (updateCompetitionDto.startDate) comp.startDate = updateCompetitionDto.startDate;
    if (updateCompetitionDto.endDate) comp.endDate = updateCompetitionDto.endDate;
    if (updateCompetitionDto.mainEventId) comp.mainEventId = updateCompetitionDto.mainEventId;

    // Post competition results
    if (updateCompetitionDto.events.length > 0) {
      if (comp.events.length > 0) {
        throw new BadRequestException('The competition already has its results posted');
      }

      this.updateCompetitionEvents(comp, updateCompetitionDto.events);
    }

    try {
      await comp.save();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteCompetition(competitionId: string) {
    let result;
    try {
      // Delete the results and the competition itself
      await this.roundModel.deleteMany({ competitionId }).exec();
      result = await this.competitionModel.deleteOne({ competitionId }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (result.deletedCount === 0) throw new NotFoundException(`Competition with id ${competitionId} not found`);
  }

  // This method must only be called when the event rounds have been populated
  private getCompetitionParticipants(events: ICompetitionEvent[]): number[] {
    const personIds: number[] = [];

    for (let event of events) {
      for (let round of event.rounds) {
        this.getParticipantsInRound(round, personIds);
      }
    }

    return personIds;
  }

  async updateCompetitionEvents(competition: CompetitionDocument, newCompEvents: ICompetitionEvent[]) {
    let activeRecordTypes: RecordTypeDocument[];
    try {
      activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    const personIds: number[] = []; // used for calculating the number of participants

    // Save every round from every event
    for (let event of newCompEvents) {
      const newCompEvent: CompetitionEvent = { eventId: event.eventId, rounds: [] };
      let sameDayRounds: RoundDocument[] = [];
      // These are set to null if there are no active record types
      const singleRecords: any = await this.getRecords('regionalSingleRecord', event.eventId, activeRecordTypes);
      const avgRecords: any = await this.getRecords('regionalAverageRecord', event.eventId, activeRecordTypes);

      for (let round of event.rounds) {
        const newRound: RoundDocument = round as RoundDocument;

        // ASSUMES THE ROUNDS ARE SORTED BY DATE
        if (activeRecordTypes.length > 0) {
          // Set the records from the last day, when the day changes
          if (sameDayRounds.length > 0 && round.date !== sameDayRounds[0].date) {
            this.setRecords(sameDayRounds, activeRecordTypes, singleRecords, avgRecords);
            sameDayRounds = [];
          }
          sameDayRounds.push(newRound);
        }

        newCompEvent.rounds.push(newRound);
        this.getParticipantsInRound(round, personIds);
      }

      // Set the records for the last day of rounds
      this.setRecords(sameDayRounds, activeRecordTypes, singleRecords, avgRecords);

      // Save all of the round documents and add the event to competition events
      try {
        newCompEvent.rounds.forEach(async (el: RoundDocument) => {
          await this.roundModel.create(el);
        });
      } catch (err) {
        throw new InternalServerErrorException(err.message);
      }
      competition.events.push(newCompEvent);
    }

    competition.participants = personIds.length;
  }

  // Adds new unique participants to the personIds array
  private getParticipantsInRound(round: IRound, personIds: number[]): void {
    for (let result of round.results) {
      // personId can have multiple ids separated by ; so all ids need to be checked
      for (let personId of result.personId.split(';').map((el) => parseInt(el))) {
        if (!personIds.includes(personId)) {
          personIds.push(personId);
        }
      }
    }
  }

  // Returns null if no record types are active
  async getRecords(
    type: 'regionalSingleRecord' | 'regionalAverageRecord',
    eventId: string,
    activeRecordTypes: RecordTypeDocument[],
  ) {
    let records = null;
    let query;
    let rounds: RoundDocument[];
    const typeReadable = type === 'regionalSingleRecord' ? 'best' : 'average';

    console.log(`Getting ${typeReadable} records for event ${eventId}`);

    // Go through all active record types
    for (let rt of activeRecordTypes) {
      if (!records) records = {} as any;

      query = { eventId, [`results.${type}`]: rt.label };
      rounds = await this.roundModel.find(query).sort({ date: -1 }).limit(1);

      if (rounds.length > 0) {
        records[rt.wcaEquivalent] = (rounds[0].results.find((el) => el[type] === rt.label) as any)[typeReadable];
      } else {
        records[rt.wcaEquivalent] = Infinity;
      }
    }

    console.log('Found records:', records);

    return records;
  }

  setRecords(
    sameDayRounds: RoundDocument[],
    activeRecordTypes: RecordTypeDocument[],
    singleRecords: any,
    avgRecords: any,
  ) {
    console.log(`Setting records for event ${sameDayRounds[0].eventId}`);

    for (let rt of activeRecordTypes) {
      for (let round of sameDayRounds) {
        for (let result of round.results) {
          if (result.best > 0 && result.best < singleRecords[rt.wcaEquivalent]) {
            result.regionalSingleRecord = rt.label;
          }
          if (result.average > 0 && result.average < avgRecords[rt.wcaEquivalent]) {
            result.regionalAverageRecord = rt.label;
          }
        }
      }
    }
  }
}
