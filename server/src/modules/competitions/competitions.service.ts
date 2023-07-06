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
import { RecordTypesService } from '@m/record-types/record-types.service';
import { ICompetitionEvent, ICompetitionData, ICompetitionModData } from '@sh/interfaces/Competition';
import IRound from '@sh/interfaces/Round';
import { ResultDocument } from '~/src/models/result.model';
import IResult from '@sh/interfaces/Result';

interface CompetitionUpdateResult {
  events: ICompetitionEvent[];
  participants: number;
}

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
          output.persons = await this.personModel.find({ personId: { $in: personIds } }, excl).exec();

          const eventIds = output.competition.events.map((el) => el.eventId);
          output.events = await this.eventModel
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

  async getModCompetition(competitionId: string): Promise<ICompetitionModData> {
    const competition = await this.getFullCompetition(competitionId);
    const events = await this.eventModel.find().sort({ rank: 1 }).exec();

    if (competition) {
      const output: ICompetitionModData = {
        competition,
        events,
        singleRecords: {} as any,
        avgRecords: {} as any,
      };
      const activeRecordTypes = await this.getActiveRecordTypes();

      // Get all current records
      for (const event of events) {
        output.singleRecords[event.eventId] = await this.getRecords(
          'regionalSingleRecord',
          event.eventId,
          activeRecordTypes,
        );
        output.avgRecords[event.eventId] = await this.getRecords(
          'regionalAverageRecord',
          event.eventId,
          activeRecordTypes,
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
    if (updateCompetitionDto.city) comp.city = updateCompetitionDto.city;
    if (updateCompetitionDto.countryId) comp.countryId = updateCompetitionDto.countryId;
    if (updateCompetitionDto.startDate) comp.startDate = updateCompetitionDto.startDate;
    if (updateCompetitionDto.endDate) comp.endDate = updateCompetitionDto.endDate;
    if (updateCompetitionDto.mainEventId) comp.mainEventId = updateCompetitionDto.mainEventId;

    // Post competition results
    if (updateCompetitionDto.events.length > 0) {
      let tempRounds: IRound[];
      let tempResults: IResult[];

      if (comp.events.length > 0) {
        console.log('Rewriting existing competition results');

        // Reset the records for now
        for (const event of updateCompetitionDto.events) {
          for (const round of event.rounds) {
            for (const result of round.results) {
              delete result.regionalSingleRecord;
              delete result.regionalAverageRecord;
            }
          }
        }

        // Store the rounds and results temporarily in case
        tempRounds = (await this.roundModel.find({ competitionId })) as IRound[];
        tempResults = (await this.resultModel.find({ competitionId })) as IResult[];
        await this.roundModel.deleteMany({ competitionId });
        await this.resultModel.deleteMany({ competitionId });
      }

      try {
        // throw new Error('test error');
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

  // HELPERS

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

  private async getActiveRecordTypes(): Promise<RecordTypeDocument[]> {
    try {
      return await this.recordTypesService.getRecordTypes({ active: true });
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateCompetitionEvents(newCompEvents: ICompetitionEvent[]): Promise<CompetitionUpdateResult> {
    const output = { events: [] } as CompetitionUpdateResult;
    const activeRecordTypes = await this.getActiveRecordTypes();
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
      output.events.push(newCompEvent);
    }

    output.participants = personIds.length;
    return output;
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
  // (but only the active record types)
  async setRecords(
    sameDayRounds: IRound[],
    activeRecordTypes: RecordTypeDocument[],
    singleRecords: any,
    avgRecords: any,
  ): Promise<Round[]> {
    const rounds: Round[] = [];

    for (const rt of activeRecordTypes) {
      let bestSingle = Infinity;
      let bestAvg = Infinity;
      // We need the arrays, because there can be multiple tied records
      let newSingleRecordResults: IResult[] = [];
      let newAvgRecordResults: IResult[] = [];

      // First get the best results
      for (const round of sameDayRounds) {
        for (const result of round.results) {
          if (result.best > 0 && result.best <= singleRecords[rt.wcaEquivalent] && result.best <= bestSingle) {
            if (result.best === bestSingle) {
              newSingleRecordResults.push(result);
            } else {
              newSingleRecordResults = [result];
              bestSingle = result.best;
            }
          }
        }
      }
      for (const round of sameDayRounds) {
        for (const result of round.results) {
          if (result.average > 0 && result.average <= avgRecords[rt.wcaEquivalent] && result.average <= bestAvg) {
            if (result.average === bestAvg) {
              newAvgRecordResults.push(result);
            } else {
              newAvgRecordResults = [result];
              bestAvg = result.average;
            }
          }
        }
      }

      // Mark the new records
      newSingleRecordResults.forEach((el) => {
        console.log(`New ${el.eventId} single ${rt.label} set: ${el.best}`);
        el.regionalSingleRecord = rt.label;
        singleRecords[rt.wcaEquivalent] = el.best;
      });
      newAvgRecordResults.forEach((el) => {
        console.log(`New ${el.eventId} average ${rt.label} set: ${el.average}`);
        el.regionalAverageRecord = rt.label;
        avgRecords[rt.wcaEquivalent] = el.average;
      });

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

    return rounds;
  }
}
