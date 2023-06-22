import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompetitionDocument } from '~/src/models/competition.model';
import { formatCompetition } from '~/src/helpers/competitionHelpers';

@Injectable()
export class CompetitionsService {
  constructor(@InjectModel('Competition') private readonly model: Model<CreateCompetitionDto>) {}

  async getCompetitions(region?: string) {
    let queryFilter = region ? { country: region } : {};

    try {
      const results: CompetitionDocument[] = await this.model.find(queryFilter).exec();
      return results.map((el) => formatCompetition(el));
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getCompetition(competitionId: string) {
    const comp: CompetitionDocument = await this.findCompetition(competitionId);
    return formatCompetition(comp);
  }

  async createCompetition(createCompetitionDto: CreateCompetitionDto) {
    const comp: CompetitionDocument = await this.model.findOne({
      competitionId: createCompetitionDto.competitionId,
    });

    if (comp) {
      throw new BadRequestException(`Competition with id ${createCompetitionDto.competitionId} already exists!`);
    }

    try {
      const newCompetition = new this.model(createCompetitionDto);
      const result: CompetitionDocument = await newCompetition.save();

      return formatCompetition(result);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateCompetition(competitionId: string, updateCompetitionDto: UpdateCompetitionDto) {
    const comp: CompetitionDocument = await this.findCompetition(competitionId);

    if (updateCompetitionDto.name) comp.name = updateCompetitionDto.name;
    if (updateCompetitionDto.city) comp.city = updateCompetitionDto.city;
    if (updateCompetitionDto.country) comp.country = updateCompetitionDto.country;
    if (updateCompetitionDto.startDate) comp.startDate = updateCompetitionDto.startDate;
    if (updateCompetitionDto.endDate) comp.endDate = updateCompetitionDto.endDate;
    // if (updateCompetitionDto.events?.length > 0) comp.events = updateCompetitionDto.events;
    if (updateCompetitionDto.mainEventId) comp.mainEventId = updateCompetitionDto.mainEventId;

    try {
      comp.save();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteCompetition(competitionId: string) {
    let result;

    try {
      result = await this.model.deleteOne({ competitionId }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (result.deletedCount === 0) throw new NotFoundException(`Competition with id ${competitionId} not found!`);
  }

  // HELPER METHODS

  private async findCompetition(competitionId: string): Promise<CompetitionDocument> {
    let competition: CompetitionDocument;

    try {
      competition = await this.model.findOne({ competitionId }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (!competition) throw new NotFoundException(`Competition with id ${competitionId} not found!`);

    return competition;
  }
}
