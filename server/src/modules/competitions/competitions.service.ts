import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { find } from 'geo-tz';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompetitionEvent, CompetitionDocument } from '~/src/models/competition.model';
import { excl, exclSysButKeepCreatedBy } from '~/src/helpers/dbHelpers';
import { RoundDocument } from '~/src/models/round.model';
import { ResultDocument } from '~/src/models/result.model';
import { ResultsService } from '@m/results/results.service';
import { EventsService } from '@m/events/events.service';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { PersonsService } from '@m/persons/persons.service';
import { ICompetitionEvent, ICompetitionData, ICompetition } from '@sh/interfaces';
import { CompetitionState, CompetitionType } from '@sh/enums';
import { Role } from '@sh/enums';
import { ScheduleDocument } from '~/src/models/schedule.model';
import { IPartialUser } from '~/src/helpers/interfaces/User';
import { AuthService } from '../auth/auth.service';

const eventPopulateOptions = {
  event: { path: 'events.event', model: 'Event' },
  rounds: {
    path: 'events.rounds',
    model: 'Round',
    populate: [
      {
        path: 'results',
        model: 'Result',
      },
    ],
  },
};

@Injectable()
export class CompetitionsService {
  constructor(
    private eventsService: EventsService,
    private resultsService: ResultsService,
    private recordTypesService: RecordTypesService,
    private personsService: PersonsService,
    private authService: AuthService,
    @InjectModel('Competition') private readonly competitionModel: Model<CompetitionDocument>,
    @InjectModel('Round') private readonly roundModel: Model<RoundDocument>,
    @InjectModel('Result') private readonly resultModel: Model<ResultDocument>,
    @InjectModel('Schedule') private readonly scheduleModel: Model<ScheduleDocument>,
  ) {}

  async getCompetitions(region?: string): Promise<CompetitionDocument[]> {
    const queryFilter: any = { state: { $gt: CompetitionState.Created } };
    if (region) queryFilter.countryIso2 = region;

    try {
      const competitions = await this.competitionModel.find(queryFilter, excl).sort({ startDate: -1 }).exec();
      return competitions;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getModCompetitions(user: IPartialUser): Promise<ICompetition[]> {
    let queryFilter: any = {};
    if (!user.roles.includes(Role.Admin)) queryFilter = { createdBy: user.personId };

    try {
      return await this.competitionModel.find(queryFilter, excl).sort({ startDate: -1 }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getCompetition(competitionId: string, user?: IPartialUser): Promise<ICompetitionData> {
    const competition = await this.getFullCompetition(competitionId, user);
    const activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });

    try {
      // TEMPORARILY DISABLED until mod-only protection is added
      // if (competition?.state > CompetitionState.Created) {

      const output: ICompetitionData = {
        competition,
        persons: await this.personsService.getCompetitionParticipants({ compEvents: competition.events }),
        activeRecordTypes,
      };

      if (user) {
        output.recordPairsByEvent = await this.resultsService.getRecordPairs(
          competition.events.map((el) => el.event.eventId),
          competition.startDate,
          activeRecordTypes,
        );
      }

      return output;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // Create new competition, if one with that id doesn't already exist (no results yet)
  async createCompetition(createCompDto: CreateCompetitionDto, creatorPersonId: number) {
    let comp;
    try {
      comp = await this.competitionModel.findOne({ competitionId: createCompDto.competitionId }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (comp) throw new BadRequestException(`A competition with the ID ${createCompDto.competitionId} already exists`);

    try {
      comp = await this.competitionModel.findOne({ name: createCompDto.name }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (comp) throw new BadRequestException(`A competition with the name ${createCompDto.name} already exists`);

    try {
      // First save all of the rounds in the DB (without any results until they get posted)
      const competitionEvents: CompetitionEvent[] = [];

      for (const compEvent of createCompDto.events) {
        competitionEvents.push(await this.getNewCompetitionEvent(compEvent));
      }

      // Create new competition
      const newCompetition: ICompetition = {
        ...createCompDto,
        events: competitionEvents,
        createdBy: creatorPersonId,
        state: CompetitionState.Created,
        participants: 0,
      };

      newCompetition.organizers = await this.personsService.getPersonsById(
        createCompDto.organizers.map((org) => org.personId),
      );

      if (createCompDto.type === CompetitionType.Meetup) {
        newCompetition.timezone = find(
          createCompDto.latitudeMicrodegrees / 1000000,
          createCompDto.longitudeMicrodegrees / 1000000,
        )[0];
      } else if (createCompDto.type === CompetitionType.Competition) {
        newCompetition.compDetails.schedule = await this.scheduleModel.create(createCompDto.compDetails.schedule);
      }

      await this.competitionModel.create(newCompetition);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateCompetition(competitionId: string, updateCompetitionDto: UpdateCompetitionDto, user: IPartialUser) {
    const comp = await this.findCompetition(competitionId, true);
    this.authService.checkAccessRightsToComp(user, comp);
    const isAdmin = user.roles.includes(Role.Admin);

    if (isAdmin || comp.state < CompetitionState.Finished) {
      comp.organizers = await this.personsService.getPersonsById(
        updateCompetitionDto.organizers.map((org) => org.personId),
      );
      if (updateCompetitionDto.contact) comp.contact = updateCompetitionDto.contact;
      if (updateCompetitionDto.description) comp.description = updateCompetitionDto.description;

      comp.events = await this.updateCompetitionEvents(comp, updateCompetitionDto.events);
    }

    if (isAdmin || comp.state < CompetitionState.Approved) {
      comp.name = updateCompetitionDto.name;
      if (updateCompetitionDto.city) comp.city = updateCompetitionDto.city;
      if (updateCompetitionDto.venue) comp.venue = updateCompetitionDto.venue;
      if (updateCompetitionDto.address) comp.address = updateCompetitionDto.address;
      if (updateCompetitionDto.latitudeMicrodegrees && updateCompetitionDto.longitudeMicrodegrees) {
        comp.latitudeMicrodegrees = updateCompetitionDto.latitudeMicrodegrees;
        comp.longitudeMicrodegrees = updateCompetitionDto.longitudeMicrodegrees;
      }
      if (updateCompetitionDto.competitorLimit) comp.competitorLimit = updateCompetitionDto.competitorLimit;
      comp.mainEventId = updateCompetitionDto.mainEventId;

      // TO-DO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      if (updateCompetitionDto.compDetails) {
        // comp.compDetails.schedule = updateCompetitionDto.compDetails.schedule;
      }
    }

    // Even an admin is not allowed to edit these after a comp has been approved
    if (comp.state < CompetitionState.Approved) {
      comp.startDate = updateCompetitionDto.startDate;
      if (comp.endDate) comp.endDate = updateCompetitionDto.endDate;
    }

    await this.saveCompetition(comp);
  }

  async updateState(competitionId: string, newState: CompetitionState, user: IPartialUser) {
    const comp = await this.findCompetition(competitionId);
    this.authService.checkAccessRightsToComp(user, comp);
    const isAdmin = user.roles.includes(Role.Admin);

    if (
      isAdmin ||
      // Allow mods only to finish an ongoing competition
      (comp.state === CompetitionState.Ongoing && newState === CompetitionState.Finished)
    ) {
      comp.state = newState;
    }

    if (isAdmin && newState === CompetitionState.Published) {
      console.log(`Publishing competition ${comp.competitionId}`);

      try {
        await this.roundModel.updateMany({ competitionId: comp.competitionId }, { $unset: { compNotPublished: '' } });
        await this.resultModel.updateMany({ competitionId: comp.competitionId }, { $unset: { compNotPublished: '' } });
      } catch (err) {
        throw new InternalServerErrorException(`Error while publishing competition: ${err.message}`);
      }
    }

    await this.saveCompetition(comp);
  }

  /////////////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////////////

  private async findCompetition(competitionId: string, populateEvents = false): Promise<CompetitionDocument> {
    let competition: CompetitionDocument;

    try {
      if (!populateEvents) {
        competition = await this.competitionModel.findOne({ competitionId }).exec();
      } else {
        competition = await this.competitionModel
          .findOne({ competitionId })
          .populate(eventPopulateOptions.event)
          .populate(eventPopulateOptions.rounds)
          .exec();
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (!competition) throw new NotFoundException(`Competition with id ${competitionId} not found`);

    return competition;
  }

  private async saveCompetition(competition: CompetitionDocument) {
    try {
      await competition.save();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // Finds the competition with the given competition id with the rounds and results populated
  private async getFullCompetition(competitionId: string, user?: IPartialUser): Promise<CompetitionDocument> {
    let competition: CompetitionDocument;

    try {
      competition = await this.competitionModel
        // createdBy is used to check access rights below, and then excluded
        .findOne({ competitionId }, exclSysButKeepCreatedBy)
        .populate(eventPopulateOptions.event)
        .populate(eventPopulateOptions.rounds)
        .populate({ path: 'organizers', model: 'Person' })
        .exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (!competition) throw new NotFoundException(`Contest with ID ${competitionId} not found`);

    if (user) this.authService.checkAccessRightsToComp(user, competition);
    competition.createdBy = undefined;

    if (competition.compDetails) {
      try {
        await competition.populate({ path: 'compDetails.schedule', model: 'Schedule' });
      } catch (err) {
        throw new InternalServerErrorException(err.message);
      }
    }

    return competition;
  }

  private async getNewCompetitionEvent(compEvent: ICompetitionEvent): Promise<CompetitionEvent> {
    const eventRounds: RoundDocument[] = [];

    for (const round of compEvent.rounds) eventRounds.push(await this.roundModel.create(round));

    return {
      event: await this.eventsService.getEventById(compEvent.event.eventId),
      rounds: eventRounds,
    };
  }

  // Deletes/adds/updates competition events and rounds
  private async updateCompetitionEvents(
    comp: CompetitionDocument,
    newEvents: ICompetitionEvent[],
  ): Promise<CompetitionEvent[]> {
    try {
      // Remove deleted rounds and events
      for (const compEvent of comp.events) {
        const sameEventInNew = newEvents.find((el) => el.event.eventId === compEvent.event.eventId);

        if (sameEventInNew) {
          for (const round of compEvent.rounds) {
            // Delete round if it has no results
            if (round.results.length === 0 && !sameEventInNew.rounds.some((el) => el.roundId === round.roundId)) {
              await round.deleteOne();
              compEvent.rounds = compEvent.rounds.filter((el) => el !== round);
            }
          }
        }
        // Delete event and all of its rounds if it has no results
        else if (!compEvent.rounds.some((el) => el.results.length > 0)) {
          for (const round of compEvent.rounds) await round.deleteOne();
          comp.events = comp.events.filter((el) => el.event.eventId !== compEvent.event.eventId);
        }
      }

      // Update rounds and add new events
      for (const newEvent of newEvents) {
        const sameEventInComp = comp.events.find((el) => el.event.eventId === newEvent.event.eventId);

        if (sameEventInComp) {
          for (const round of newEvent.rounds) {
            const sameRoundInComp = sameEventInComp.rounds.find((el) => el.roundId === round.roundId);

            // If the competition already has this round, update the permitted fields
            if (sameRoundInComp) {
              sameRoundInComp.roundTypeId = round.roundTypeId;

              if (sameRoundInComp.results.length === 0) {
                sameRoundInComp.format = round.format;
                if (comp.state < CompetitionState.Approved) sameRoundInComp.date = round.date;
              }

              // Update proceed object if the updated round has it and the round has no results
              // or set it, if the round previously had no proceed object (meaning it was the final round)
              if (round.proceed) {
                if (sameRoundInComp.results.length === 0 || !sameRoundInComp.proceed)
                  sameRoundInComp.proceed = round.proceed;
              }
              // Unset proceed object if it got deleted (the round became the final round due to a deletion)
              else sameRoundInComp.proceed = undefined;

              await sameRoundInComp.save();
            }
            // If it's a new round, add it
            else {
              sameEventInComp.rounds.push(await this.roundModel.create(round));
            }
          }
        } else {
          comp.events.push(await this.getNewCompetitionEvent(newEvent));
        }
      }

      // Sort competition events by rank
      comp.events.sort((a, b) => a.event.rank - b.event.rank);

      return comp.events;
    } catch (err) {
      throw new InternalServerErrorException(`Error while updating competition events: ${err.message}`);
    }
  }
}
