import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompetitionDocument } from '~/src/models/competition.model';
import { RoundDocument } from '~/src/models/round.model';
import { EventDocument } from '~/src/models/event.model';
import ICompetition, { ICompetitionData, ICompetitionEvent } from '@sh/interfaces/Competition';
import IRound, { IResult } from '@sh/interfaces/Round';
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
    const competition: CompetitionDocument = await this.findCompetition(competitionId, true);

    const output: ICompetitionData = {
      competition,
      eventsInfo: [],
      persons: [],
    };

    if (competition.events.length > 0) {
      const personIds: number[] = [];
      output.competition.participants = this.getCompetitionParticipants(competition.events, personIds);

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
        }

        comp.events.push(newEvent);
      }

      comp.participants = this.getCompetitionParticipants(comp.events);
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

  private async findCompetition(competitionId: string, populate = false): Promise<CompetitionDocument> {
    let competition: CompetitionDocument;

    try {
      competition = await this.competitionModel.findOne({ competitionId }).populate('rounds').exec();
      console.log(competition);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (!competition) throw new NotFoundException(`Competition with id ${competitionId} not found`);

    return competition;
  }

  // Only gets persons that aren't already in the personIds array
  private getCompetitionParticipants(events: ICompetitionEvent[], personIds: number[] = []): number {
    for (let event of events) {
      for (let round of event.rounds) {
        for (let result of (round as IRound).results) {
          // personId can have multiple ids separated by ; so all ids need to be checked
          for (let personId of result.personId.split(';').map((el) => parseInt(el))) {
            if (!personIds.includes(personId)) personIds.push(personId);
          }
        }
      }
    }

    return personIds.length;
  }
}
