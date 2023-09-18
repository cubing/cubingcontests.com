import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { find } from 'geo-tz';
import { CreateContestDto } from './dto/create-contest.dto';
import { UpdateCompetitionDto } from './dto/update-contest.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContestEvent, ContestDocument } from '~/src/models/contest.model';
import { excl, exclSysButKeepCreatedBy } from '~/src/helpers/dbHelpers';
import { RoundDocument } from '~/src/models/round.model';
import { ResultDocument } from '~/src/models/result.model';
import { ResultsService } from '@m/results/results.service';
import { EventsService } from '@m/events/events.service';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { PersonsService } from '@m/persons/persons.service';
import { IContestEvent, IContestData, IContest } from '@sh/interfaces';
import { ContestState, ContestType } from '@sh/enums';
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
    @InjectModel('Competition') private readonly contestModel: Model<ContestDocument>,
    @InjectModel('Round') private readonly roundModel: Model<RoundDocument>,
    @InjectModel('Result') private readonly resultModel: Model<ResultDocument>,
    @InjectModel('Schedule') private readonly scheduleModel: Model<ScheduleDocument>,
  ) {}

  async getCompetitions(region?: string): Promise<ContestDocument[]> {
    const queryFilter: any = { state: { $gt: ContestState.Created } };
    if (region) queryFilter.countryIso2 = region;

    try {
      const contests = await this.contestModel.find(queryFilter, excl).sort({ startDate: -1 }).exec();
      return contests;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getModCompetitions(user: IPartialUser): Promise<IContest[]> {
    let queryFilter: any = {};
    if (!user.roles.includes(Role.Admin)) queryFilter = { createdBy: user.personId };

    try {
      return await this.contestModel.find(queryFilter, excl).sort({ startDate: -1 }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getCompetition(competitionId: string, user?: IPartialUser): Promise<IContestData> {
    const contest = await this.getFullCompetition(competitionId, user);
    const activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });

    try {
      // TEMPORARILY DISABLED until mod-only protection is added
      // if (contest?.state > ContestState.Created) {

      const output: IContestData = {
        contest,
        persons: await this.personsService.getCompetitionParticipants({ compEvents: contest.events }),
        activeRecordTypes,
      };

      if (user) {
        output.recordPairsByEvent = await this.resultsService.getRecordPairs(
          contest.events.map((el) => el.event.eventId),
          contest.startDate,
          activeRecordTypes,
        );
      }

      return output;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // Create new contest, if one with that id doesn't already exist (no results yet)
  async createCompetition(createCompDto: CreateContestDto, creatorPersonId: number) {
    let comp;
    try {
      comp = await this.contestModel.findOne({ competitionId: createCompDto.competitionId }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (comp) throw new BadRequestException(`A contest with the ID ${createCompDto.competitionId} already exists`);

    try {
      comp = await this.contestModel.findOne({ name: createCompDto.name }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (comp) throw new BadRequestException(`A contest with the name ${createCompDto.name} already exists`);

    try {
      // First save all of the rounds in the DB (without any results until they get posted)
      const contestEvents: ContestEvent[] = [];

      for (const compEvent of createCompDto.events) {
        contestEvents.push(await this.getNewContestEvent(compEvent));
      }

      // Create new contest
      const newCompetition: IContest = {
        ...createCompDto,
        events: contestEvents,
        createdBy: creatorPersonId,
        state: ContestState.Created,
        participants: 0,
      };

      newCompetition.organizers = await this.personsService.getPersonsById(
        createCompDto.organizers.map((org) => org.personId),
      );

      if (createCompDto.type === ContestType.Meetup) {
        newCompetition.timezone = find(
          createCompDto.latitudeMicrodegrees / 1000000,
          createCompDto.longitudeMicrodegrees / 1000000,
        )[0];
      } else if (createCompDto.type === ContestType.Competition) {
        newCompetition.compDetails.schedule = await this.scheduleModel.create(createCompDto.compDetails.schedule);
      }

      await this.contestModel.create(newCompetition);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateCompetition(competitionId: string, updateCompetitionDto: UpdateCompetitionDto, user: IPartialUser) {
    const comp = await this.findCompetition(competitionId, true);
    // Makes sure the user is an admin or a moderator who has access rights to the UNFINISHED comp.
    // If the comp is finished and the user is not an admin, an unauthorized exception is thrown.
    this.authService.checkAccessRightsToComp(user, comp);
    const isAdmin = user.roles.includes(Role.Admin);

    comp.organizers = await this.personsService.getPersonsById(
      updateCompetitionDto.organizers.map((org) => org.personId),
    );
    if (updateCompetitionDto.contact) comp.contact = updateCompetitionDto.contact;
    if (updateCompetitionDto.description) comp.description = updateCompetitionDto.description;

    comp.events = await this.updateContestEvents(comp, updateCompetitionDto.events);

    if (isAdmin || comp.state < ContestState.Approved) {
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

      if (updateCompetitionDto.compDetails) {
        await this.scheduleModel.updateOne(
          { _id: comp.compDetails.schedule._id },
          updateCompetitionDto.compDetails.schedule,
        );
      }
    }

    // Even an admin is not allowed to edit these after a comp has been approved
    if (comp.state < ContestState.Approved) {
      comp.startDate = updateCompetitionDto.startDate;
      if (comp.endDate) comp.endDate = updateCompetitionDto.endDate;
    }

    await this.saveCompetition(comp);
  }

  async updateState(competitionId: string, newState: ContestState, user: IPartialUser) {
    const comp = await this.findCompetition(competitionId);
    this.authService.checkAccessRightsToComp(user, comp);
    const isAdmin = user.roles.includes(Role.Admin);

    if (
      isAdmin ||
      // Allow mods only to finish an ongoing competition
      (comp.state === ContestState.Ongoing && newState === ContestState.Finished)
    ) {
      comp.state = newState;
    }

    if (isAdmin && newState === ContestState.Published) {
      console.log(`Publishing contest ${comp.competitionId}...`);

      try {
        // Unset unapproved from the results so that they can be included in the rankings
        await this.resultModel.updateMany({ competitionId: comp.competitionId }, { $unset: { unapproved: '' } });

        await this.resultsService.resetRecordsCancelledByPublishedComp(comp.competitionId);
      } catch (err) {
        throw new InternalServerErrorException(`Error while publishing contest: ${err.message}`);
      }
    }

    await this.saveCompetition(comp);
  }

  /////////////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////////////

  private async findCompetition(competitionId: string, populateEvents = false): Promise<ContestDocument> {
    let contest: ContestDocument;

    try {
      if (!populateEvents) {
        contest = await this.contestModel.findOne({ competitionId }).exec();
      } else {
        contest = await this.contestModel
          .findOne({ competitionId })
          .populate(eventPopulateOptions.event)
          .populate(eventPopulateOptions.rounds)
          .exec();
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (!contest) throw new NotFoundException(`Competition with id ${competitionId} not found`);

    return contest;
  }

  private async saveCompetition(contest: ContestDocument) {
    try {
      await contest.save();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // Finds the contest with the given competition ID with the rounds and results populated
  private async getFullCompetition(competitionId: string, user?: IPartialUser): Promise<ContestDocument> {
    let contest: ContestDocument;

    try {
      contest = await this.contestModel
        // createdBy is used to check access rights below, and then excluded
        .findOne({ competitionId }, exclSysButKeepCreatedBy)
        .populate(eventPopulateOptions.event)
        .populate(eventPopulateOptions.rounds)
        .populate({ path: 'organizers', model: 'Person' })
        .exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (!contest) throw new NotFoundException(`Contest with ID ${competitionId} not found`);

    if (user) this.authService.checkAccessRightsToComp(user, contest, { ignoreState: true });
    contest.createdBy = undefined;

    if (contest.compDetails) {
      try {
        await contest.populate({ path: 'compDetails.schedule', model: 'Schedule' });
      } catch (err) {
        throw new InternalServerErrorException(err.message);
      }
    }

    return contest;
  }

  private async getNewContestEvent(compEvent: IContestEvent): Promise<ContestEvent> {
    const eventRounds: RoundDocument[] = [];

    for (const round of compEvent.rounds) eventRounds.push(await this.roundModel.create(round));

    return {
      event: await this.eventsService.getEventById(compEvent.event.eventId),
      rounds: eventRounds,
    };
  }

  // Deletes/adds/updates contest events and rounds
  private async updateContestEvents(comp: ContestDocument, newEvents: IContestEvent[]): Promise<ContestEvent[]> {
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

            // If the contest already has this round, update the permitted fields
            if (sameRoundInComp) {
              sameRoundInComp.roundTypeId = round.roundTypeId;

              if (sameRoundInComp.results.length === 0) {
                sameRoundInComp.format = round.format;
                if (comp.state < ContestState.Approved) sameRoundInComp.date = round.date;
              }

              // Update proceed object if the updated round has it, or unset proceed if it doesn't,
              // meaning that the round became the final round due to a deletion
              if (round.proceed) sameRoundInComp.proceed = round.proceed;
              else sameRoundInComp.proceed = undefined;

              await sameRoundInComp.save();
            } else {
              // If it's a new round, add it
              sameEventInComp.rounds.push(await this.roundModel.create(round));
            }
          }
        } else {
          comp.events.push(await this.getNewContestEvent(newEvent));
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
