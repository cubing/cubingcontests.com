import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompetitionDocument } from '~/src/models/competition.model';
import { RoundDocument } from '~/src/models/round.model';
import { EventDocument } from '~/src/models/event.model';
import ICompetition, { ICompetitionData } from '@sh/interfaces/Competition';
import IRound, { IResult, IRoundBase } from '@sh/interfaces/Round';
import IEvent from '@sh/interfaces/Event';
import IPerson from '@sh/interfaces/Person';

@Injectable()
export class CompetitionsService {
  constructor(
    @InjectModel('Competition') private readonly competitionModel: Model<ICompetition>,
    @InjectModel('Round') private readonly roundModel: Model<IRound>,
    @InjectModel('Event') private readonly eventModel: Model<IEvent>,
    @InjectModel('Person') private readonly personModel: Model<IPerson>,
  ) {}

  async getCompetitions(region?: string): Promise<CompetitionDocument[]> {
    let queryFilter = region ? { country: region } : {};

    try {
      return await this.competitionModel.find(queryFilter).sort({ startDate: -1 }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getCompetition(competitionId: string) {
    const comp: CompetitionDocument = await this.findCompetition(competitionId);

    const output: ICompetitionData = {
      competition: {
        competitionId: comp.competitionId,
        name: comp.name,
        city: comp.city,
        countryId: comp.countryId,
        startDate: comp.startDate,
        endDate: comp.endDate,
        mainEventId: comp.mainEventId,
      },
      eventsInfo: [],
      persons: [],
    };

    if (comp.events.length > 0) {
      output.competition.events = [];
      const personIds: number[] = [];

      for (let event of comp.events) {
        const outputEvent = { eventId: event.eventId, rounds: [] as IRoundBase[] };

        for (let roundId of event.rounds) {
          const round: RoundDocument = await this.roundModel.findById(roundId).exec();
          outputEvent.rounds.push({
            roundTypeId: round.roundTypeId,
            format: round.format,
            results: round.results,
          } as IRoundBase);

          // Check participants
          personIds.push(...this.getPersonsInRound(round.results, personIds));
        }

        output.competition.events.push(outputEvent);
      }

      output.competition.participants = comp.participants;

      // Get information about all participants of the competition
      const personResults = await this.personModel.find({ personId: { $in: personIds } }).exec();

      output.persons = personResults.map((el) => ({
        personId: el.personId,
        name: el.name,
        countryId: el.countryId,
      }));

      // Get information about all events held at the competition from the DB
      const eventIds = output.competition.events.map((el) => el.eventId);

      const eventResults: EventDocument[] = await this.eventModel
        .find({ eventId: { $in: eventIds } })
        .sort({ rank: 1 })
        .exec();

      output.eventsInfo = eventResults.map((el) => ({
        eventId: el.eventId,
        name: el.name,
        rank: el.rank,
        format: el.format,
      }));
    }

    return output;
  }

  async createCompetition(createCompetitionDto: CreateCompetitionDto) {
    const comp: CompetitionDocument = await this.competitionModel
      .findOne({
        competitionId: createCompetitionDto.competitionId,
      })
      .exec();

    if (comp) {
      throw new BadRequestException(`Competition with id ${createCompetitionDto.competitionId} already exists`);
    }

    try {
      // It's okay to save as is, because the competition doesn't yet have results
      const newCompetition: CompetitionDocument = new this.competitionModel(createCompetitionDto);
      await newCompetition.save();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateCompetition(competitionId: string, updateCompetitionDto: UpdateCompetitionDto) {
    const comp: CompetitionDocument = await this.findCompetition(competitionId);

    if (updateCompetitionDto.name) comp.name = updateCompetitionDto.name;
    if (updateCompetitionDto.city) comp.city = updateCompetitionDto.city;
    if (updateCompetitionDto.countryId) comp.countryId = updateCompetitionDto.countryId;
    if (updateCompetitionDto.startDate) comp.startDate = updateCompetitionDto.startDate;
    if (updateCompetitionDto.endDate) comp.endDate = updateCompetitionDto.endDate;
    if (updateCompetitionDto.mainEventId) comp.mainEventId = updateCompetitionDto.mainEventId;
    // Post competition results
    if (updateCompetitionDto.events) {
      if (comp.events.length > 0) {
        throw new BadRequestException('The competition already has its results posted');
      }

      comp.events = [];
      const personIds: number[] = []; // used for counting the number of participants

      for (let event of updateCompetitionDto.events) {
        const newEvent = { eventId: event.eventId, rounds: [] as string[] };

        for (let round of event.rounds) {
          const newRound: RoundDocument = new this.roundModel({
            competitionId,
            eventId: event.eventId,
            ...round,
          });
          await newRound.save();
          newEvent.rounds.push(newRound._id);

          // For counting the number of unique participants later
          personIds.push(...this.getPersonsInRound(round.results, personIds));
        }

        comp.events.push(newEvent);
      }

      comp.participants = personIds.length;
    }

    try {
      comp.save();
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

  // HELPER METHODS

  private async findCompetition(competitionId: string): Promise<CompetitionDocument> {
    let competition: CompetitionDocument;

    try {
      competition = await this.competitionModel.findOne({ competitionId }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (!competition) throw new NotFoundException(`Competition with id ${competitionId} not found`);

    return competition;
  }

  // Only gets persons that aren't already in the personIds array
  private getPersonsInRound(results: IResult[], personIds: number[]): number[] {
    const personIdsInRound: number[] = [];

    for (let result of results) {
      // personId can have multiple ids separated by ; so all ids need to be checked
      for (let personId of result.personId.split(';').map((el) => parseInt(el))) {
        if (!personIds.includes(personId)) personIdsInRound.push(personId);
      }
    }

    return personIdsInRound;
  }
}
