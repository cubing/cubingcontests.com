import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompetitionDocument } from '~/src/models/competition.model';
import { RoundDocument } from '~/src/models/round.model';
import ICompetition from '@sh/interfaces/Competition';
import IRound, { IRoundBase } from '@sh/interfaces/Round';

@Injectable()
export class CompetitionsService {
  constructor(
    @InjectModel('Competition') private readonly competitionModel: Model<ICompetition>,
    @InjectModel('Round') private readonly roundModel: Model<IRound>,
  ) {}

  async getCompetitions(region?: string) {
    let queryFilter = region ? { country: region } : {};

    try {
      const results: CompetitionDocument[] = await this.competitionModel.find(queryFilter).exec();
      return results;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getCompetition(competitionId: string) {
    const comp: CompetitionDocument = await this.findCompetition(competitionId);

    const output: any = {
      competitionId: comp.competitionId,
      name: comp.name,
      city: comp.city,
      countryId: comp.countryId,
      startDate: comp.startDate,
      endDate: comp.endDate,
      mainEventId: comp.mainEventId,
    };

    if (comp.events.length > 0) {
      output.events = [];

      for (let event of comp.events) {
        const outputEvent = { eventId: event.eventId, rounds: [] };

        for (let roundId of event.rounds) {
          const r: RoundDocument = await this.roundModel.findById(roundId);
          outputEvent.rounds.push({
            roundTypeId: r.roundTypeId,
            format: r.format,
            results: r.results,
          } as IRoundBase);
        }

        output.events.push(outputEvent);
      }

      output.participants = comp.participants;
    }

    return output;
  }

  async createCompetition(createCompetitionDto: CreateCompetitionDto) {
    const comp: CompetitionDocument = await this.competitionModel.findOne({
      competitionId: createCompetitionDto.competitionId,
    });

    if (comp) {
      throw new BadRequestException(`Competition with id ${createCompetitionDto.competitionId} already exists!`);
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
      const personIds = {}; // used for counting the number of participants

      for (let event of updateCompetitionDto.events) {
        const newEvent = { eventId: event.eventId, rounds: [] };

        for (let round of event.rounds) {
          const newRound: RoundDocument = new this.roundModel({
            competitionId,
            eventId: event.eventId,
            ...round,
          });
          await newRound.save();
          newEvent.rounds.push(newRound._id);

          // For counting the number of unique participants later
          for (let result of round.results) {
            personIds[result.personId.toString()] = true;
          }
        }

        comp.events.push(newEvent);
      }

      comp.participants = Object.keys(personIds).length;
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

    if (result.deletedCount === 0) throw new NotFoundException(`Competition with id ${competitionId} not found!`);
  }

  // HELPER METHODS

  private async findCompetition(competitionId: string): Promise<CompetitionDocument> {
    let competition: CompetitionDocument;

    try {
      competition = await this.competitionModel.findOne({ competitionId }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (!competition) throw new NotFoundException(`Competition with id ${competitionId} not found!`);

    return competition;
  }
}
