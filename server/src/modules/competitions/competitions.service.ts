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
import { Result, ResultDocument } from '~/src/models/result.model';

@Injectable()
export class CompetitionsService {
  constructor(
    @InjectModel('Competition') private readonly competitionModel: Model<Competition>,
    @InjectModel('Round') private readonly roundModel: Model<RoundDocument>,
    @InjectModel('Result') private readonly resultModel: Model<ResultDocument>,
    @InjectModel('Event') private readonly eventModel: Model<Event>,
    @InjectModel('Person') private readonly personModel: Model<Person>,
    private recordTypesService: RecordTypesService,
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
    // Find the competition with the rounds populated
    let competition;
    try {
      competition = await this.competitionModel
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

      try {
        await this.updateCompetitionEvents(comp, updateCompetitionDto.events);
      } catch (err: any) {
        throw new InternalServerErrorException(`Error while updating competition events: ${err.message}`);
      }
    }

    console.log(JSON.stringify(comp, null, 2));

    try {
      await comp.save();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // async deleteCompetition(competitionId: string) {
  //   let result;
  //   try {
  //     // Delete the results and the competition itself
  //     // TO-DO: THIS NEEDS TO DELETE ALL OF THE RESULTS TOO (OR DOES IT?)
  //     await this.roundModel.deleteMany({ competitionId }).exec();
  //     result = await this.competitionModel.deleteOne({ competitionId }).exec();
  //   } catch (err) {
  //     throw new InternalServerErrorException(err.message);
  //   }

  //   if (result.deletedCount === 0) throw new NotFoundException(`Competition with id ${competitionId} not found`);
  // }

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

  async updateCompetitionEvents(competition: CompetitionDocument, newCompEvents: ICompetitionEvent[]) {
    let activeRecordTypes: RecordTypeDocument[];
    try {
      activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    const personIds: number[] = []; // used for calculating the number of participants

    // Save every round from every event
    for (const event of newCompEvents) {
      const newCompEvent: CompetitionEvent = { eventId: event.eventId, rounds: [] };
      let sameDayRounds: IRound[] = [];
      // These are set to null if there are no active record types
      const singleRecords: any = await this.getRecords('regionalSingleRecord', event.eventId, activeRecordTypes);
      const avgRecords: any = await this.getRecords('regionalAverageRecord', event.eventId, activeRecordTypes);
      const sortedRounds = event.rounds.sort((a: any, b: any) => a.date - b.date);

      for (const round of sortedRounds) {
        if (activeRecordTypes.length > 0) {
          // Set the records from the last day, when the day changes
          if (sameDayRounds.length > 0 && round.date !== sameDayRounds[0].date) {
            newCompEvent.rounds.push(
              ...(await this.setRecords(sameDayRounds, activeRecordTypes, singleRecords, avgRecords)),
            );
            sameDayRounds = [];
          }
          sameDayRounds.push(round);
        }

        this.getParticipantsInRound(round, personIds);
      }
      // Set the records for the last day of rounds
      newCompEvent.rounds.push(...(await this.setRecords(sameDayRounds, activeRecordTypes, singleRecords, avgRecords)));
      competition.events.push(newCompEvent);
    }

    competition.participants = personIds.length;
  }

  async getRecords(
    type: 'regionalSingleRecord' | 'regionalAverageRecord',
    eventId: string,
    activeRecordTypes: RecordTypeDocument[],
  ) {
    // Returns null if no record types are active
    if (activeRecordTypes.length === 0) return null;
    const records: any = {};
    const typeWord = type === 'regionalSingleRecord' ? 'best' : 'average';

    // Go through all active record types
    for (const rt of activeRecordTypes) {
      const results = await this.resultModel
        .find({ eventId, [type]: rt.label })
        .sort({ date: -1 })
        .limit(1)
        .exec();

      if (results.length > 0) {
        records[rt.wcaEquivalent] = results[0][typeWord];
      } else {
        records[rt.wcaEquivalent] = Infinity;
      }
    }

    console.log(`Found ${eventId} ${typeWord} records: ${JSON.stringify(records, null, 2)}`);
    return records;
  }

  // Sets the newly-set records in sameDayRounds using the information from singleRecords and avgRecords
  // (but only those that are active in activeRecordTypes)
  async setRecords(
    sameDayRounds: IRound[],
    activeRecordTypes: RecordTypeDocument[],
    singleRecords: any,
    avgRecords: any,
  ): Promise<Round[]> {
    const rounds: Round[] = [];

    for (const rt of activeRecordTypes) {
      for (const round of sameDayRounds) {
        const newRound = { ...round, results: [] } as Round;
        const singleSortedResults = [...round.results].sort((a: any, b: any) => a.best - b.best);
        const avgSortedResults = [...round.results].sort((a: any, b: any) => a.average - b.average);

        for (const result of singleSortedResults) {
          // First skip all of the DNFs
          if (result.best > 0) {
            if (result.best < singleRecords[rt.wcaEquivalent]) {
              console.log(`New ${round.eventId} single ${rt.label} set: ${result.best}`);
              result.regionalSingleRecord = rt.label;
            }
            break;
          }
        }
        for (const result of avgSortedResults) {
          // First skip all of the DNFs
          if (result.average > 0) {
            if (result.average < avgRecords[rt.wcaEquivalent]) {
              console.log(`New ${round.eventId} average ${rt.label} set: ${result.average}`);
              result.regionalAverageRecord = rt.label;
            }
            break;
          }
        }

        try {
          newRound.results.push(...(await this.resultModel.create(round.results)));
        } catch (err) {
          throw new InternalServerErrorException(`Error while creating result ${round.results}: ${err.message}`);
        }

        rounds.push(await this.roundModel.create(newRound));
      }
    }

    return rounds;
  }
}
