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
import { ICompetitionData, ICompetitionEvent } from '@sh/interfaces/Competition';
import IRound from '@sh/interfaces/Round';

@Injectable()
export class CompetitionsService {
  constructor(
    @InjectModel('Competition') private readonly competitionModel: Model<Competition>,
    @InjectModel('Round') private readonly roundModel: Model<Round>,
    @InjectModel('Event') private readonly eventModel: Model<Event>,
    @InjectModel('Person') private readonly personModel: Model<Person>,
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
    try {
      // Find the competition with the rounds populated
      const competition: CompetitionDocument = await this.findCompetition({ competitionId, populate: true });

      const output: ICompetitionData = {
        competition,
        eventsInfo: [],
        persons: [],
      };

      // Get information about all participants and events of the competition if the results have been posted
      if (competition.events.length > 0) {
        const personIds: number[] = this.getCompetitionParticipants(competition.events);
        output.persons = await this.personModel.find({ personId: { $in: personIds } }, excl).exec();

        const eventIds = output.competition.events.map((el) => el.eventId);
        output.eventsInfo = await this.eventModel
          .find({ eventId: { $in: eventIds } }, excl)
          .sort({ rank: 1 })
          .exec();
      }

      return output;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // Create new competition, if one with that id doesn't already exist (no results yet)
  async createCompetition(createCompetitionDto: CreateCompetitionDto) {
    try {
      const comp = await this.competitionModel.findOne({ competitionId: createCompetitionDto.competitionId }).exec();

      if (comp) {
        throw new BadRequestException(`Competition with id ${createCompetitionDto.competitionId} already exists`);
      }

      const newCompetition: CompetitionDocument = new this.competitionModel(createCompetitionDto);
      await newCompetition.save();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // Update the competition. This is also used for posting results.
  async updateCompetition(competitionId: string, updateCompetitionDto: UpdateCompetitionDto) {
    try {
      let comp: CompetitionDocument = await this.findCompetition({ competitionId, inclIntFields: true });

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

        const personIds: number[] = []; // used for calculating the number of participants

        // Save every round from every event
        for (let event of updateCompetitionDto.events) {
          const newEvent: CompetitionEvent = { eventId: event.eventId, rounds: [] };

          for (let round of event.rounds) {
            const newRound: RoundDocument = new this.roundModel({
              competitionId,
              eventId: event.eventId,
              ...round,
            });
            await newRound.save();
            newEvent.rounds.push(newRound);

            this.getParticipantsInRound(newRound, personIds);
          }

          comp.events.push(newEvent);
        }

        comp.participants = personIds.length;
      }

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

  private async findCompetition({
    competitionId,
    populate,
    inclIntFields, // include internal fields (e.g. _id)
  }: {
    competitionId: string;
    populate?: boolean;
    inclIntFields?: boolean;
  }): Promise<CompetitionDocument> {
    let competition: CompetitionDocument;

    try {
      if (populate) {
        competition = await this.competitionModel
          .findOne({ competitionId }, inclIntFields ? {} : excl)
          .populate('events.rounds')
          .exec();
      } else {
        competition = await this.competitionModel.findOne({ competitionId }, inclIntFields ? {} : excl).exec();
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (!competition) throw new NotFoundException(`Competition with id ${competitionId} not found`);

    return competition;
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
}
