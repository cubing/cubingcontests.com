import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { find } from 'geo-tz';
import { addDays } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { CreateContestDto } from './dto/create-contest.dto';
import { UpdateContestDto } from './dto/update-contest.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { ContestEvent, ContestDocument } from '~/src/models/contest.model';
import { eventPopulateOptions, excl, exclSysButKeepCreatedBy, orgPopulateOptions } from '~/src/helpers/dbHelpers';
import { RoundDocument } from '~/src/models/round.model';
import { ResultDocument } from '~/src/models/result.model';
import { ResultsService } from '@m/results/results.service';
import { EventsService } from '@m/events/events.service';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { PersonsService } from '@m/persons/persons.service';
import C from '@sh/constants';
import { IContestEvent, IContestData, IContest } from '@sh/interfaces';
import { ContestState, ContestType } from '@sh/enums';
import { Role } from '@sh/enums';
import { ScheduleDocument } from '~/src/models/schedule.model';
import { IPartialUser } from '~/src/helpers/interfaces/User';
import { MyLogger } from '~/src/modules/my-logger/my-logger.service';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '@m/email/email.service';
import { UsersService } from '@m/users/users.service';
import { getDateOnly, getIsCompType } from '@sh/sharedFunctions';

@Injectable()
export class ContestsService {
  constructor(
    private readonly logger: MyLogger,
    private readonly eventsService: EventsService,
    private readonly resultsService: ResultsService,
    private readonly recordTypesService: RecordTypesService,
    private readonly personsService: PersonsService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    @InjectModel('Competition') private readonly contestModel: Model<ContestDocument>,
    @InjectModel('Round') private readonly roundModel: Model<RoundDocument>,
    @InjectModel('Result') private readonly resultModel: Model<ResultDocument>,
    @InjectModel('Schedule') private readonly scheduleModel: Model<ScheduleDocument>,
  ) {}

  async onModuleInit() {
    if (process.env.DO_DB_CONSISTENCY_CHECKS === 'true') {
      this.logger.log('Checking contests inconsistencies in the DB...');

      const schedules = await this.scheduleModel.find().exec();

      for (const s of schedules) {
        const contests = await this.contestModel.find({ 'compDetails.schedule': s._id }).exec();

        if (contests.length === 0) {
          this.logger.error(`Error: schedule has no contest: ${JSON.stringify(s)}`);
        } else if (contests.length > 1) {
          this.logger.error(
            `Error: schedule ${JSON.stringify(s)} belongs to multiple contests: ${contests
              .map((c) => c.competitionId)
              .join(', ')}`,
          );
        } else {
          const contest = contests[0];

          for (const venue of s.venues) {
            for (const room of venue.rooms) {
              for (const activity of room.activities) {
                const startTime = utcToZonedTime(activity.startTime, venue.timezone);
                const endTime = utcToZonedTime(activity.endTime, venue.timezone);

                // Check that no activity is outside of the date range of the contest
                if (startTime < contest.startDate || endTime >= addDays(contest.endDate, 1)) {
                  this.logger.error(
                    `Error: activity ${JSON.stringify(activity)} is outside of the date range of the contest ${
                      contest.competitionId
                    }`,
                  );
                }

                if (activity.activityCode !== 'other-misc') {
                  // Check that all results for this schedule activity have the right date
                  const round = await this.roundModel
                    .findOne({ competitionId: contest.competitionId, roundId: activity.activityCode })
                    .populate({ path: 'results', model: 'Result' })
                    .exec();

                  if (!round) {
                    this.logger.error(
                      `Round for activity ${activity.activityCode} at contest ${contest.competitionId} not found`,
                    );
                  } else {
                    const activityDate = getDateOnly(startTime);

                    for (const result of round.results) {
                      if (result.date.getTime() !== activityDate.getTime())
                        this.logger.error(
                          `Result ${result} from round ${round.roundId} at ${
                            contest.competitionId
                          } has a date different from the schedule activity, which is ${activityDate.toUTCString()}`,
                        );
                    }
                  }
                }
              }
            }
          }
        }
      }

      const contests = await this.contestModel
        .find()
        .populate(eventPopulateOptions.event)
        .populate(eventPopulateOptions.rounds)
        .exec();

      for (const contest of contests) {
        for (const contestEvent of contest.events) {
          for (const round of contestEvent.rounds) {
            if (round.roundId.split('-')[0] !== contestEvent.event.eventId) {
              this.logger.error(
                `Round ${round.roundId} is inconsistent with event ${contestEvent.event.eventId} in contest ${contest.competitionId}`,
              );
            }
          }
        }
      }

      this.logger.log('All contests inconsistencies checked!');
    }
  }

  async getContests(region?: string): Promise<ContestDocument[]> {
    const queryFilter: any = { state: { $gt: ContestState.Created } };
    if (region) queryFilter.countryIso2 = region;

    try {
      const contests = await this.contestModel.find(queryFilter, excl).sort({ startDate: -1 }).exec();
      return contests;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getModContests(user: IPartialUser): Promise<IContest[]> {
    let queryFilter: any = {};

    // Check access rights
    if (!user.roles.includes(Role.Admin)) {
      const person = await this.personsService.getPersonById(user.personId);
      queryFilter = { organizers: person._id };
    }

    try {
      const contests = await this.contestModel.find(queryFilter, excl).sort({ startDate: -1 }).exec();
      return contests;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getContest(competitionId: string, user?: IPartialUser): Promise<IContestData> {
    // This also checks access rights to the contest if it's a request for a mod contest (user is defined)
    const contest = await this.getFullContest(competitionId, user);
    const activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });

    try {
      // TEMPORARILY DISABLED until mod-only protection is added
      // if (contest?.state > ContestState.Created) {

      const output: IContestData = {
        contest,
        persons: await this.personsService.getContestParticipants({ contestEvents: contest.events }),
        activeRecordTypes,
      };

      if (user) {
        output.recordPairsByEvent = await this.resultsService.getRecordPairs(
          contest.events.map((el) => el.event),
          contest.startDate,
          { activeRecordTypes },
        );
      }

      return output;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // Create new contest, if one with that ID doesn't already exist
  async createContest(
    createContestDto: CreateContestDto,
    { user, saveResults = false }: { user: IPartialUser; saveResults: boolean },
  ) {
    const isAdmin = user.roles.includes(Role.Admin);
    const contestUrl = this.getContestUrl(createContestDto.competitionId);

    // Validation
    if (!isAdmin) {
      this.validateContest(createContestDto, user);
      saveResults = false;
    }

    const comp1 = await this.contestModel.findOne({ competitionId: createContestDto.competitionId }).exec();
    if (comp1) throw new BadRequestException(`A contest with the ID ${createContestDto.competitionId} already exists`);
    const comp2 = await this.contestModel.findOne({ name: createContestDto.name }).exec();
    if (comp2) throw new BadRequestException(`A contest with the name ${createContestDto.name} already exists`);

    try {
      // First save all of the rounds in the DB (without any results until they get posted)
      const contestEvents: ContestEvent[] = [];
      const contestCreatorEmail = await this.usersService.getUserEmail({ _id: user._id });

      for (const contestEvent of createContestDto.events) {
        contestEvents.push(await this.getNewContestEvent(contestEvent, saveResults));
      }

      // Create new contest
      const newCompetition: IContest = {
        ...createContestDto,
        events: contestEvents,
        createdBy: new mongoose.Types.ObjectId(user._id as string),
        state: ContestState.Created,
        participants: !saveResults
          ? 0
          : (await this.personsService.getContestParticipants({ contestEvents: contestEvents })).length,
      };

      newCompetition.organizers = await this.personsService.getPersonsById(
        createContestDto.organizers.map((org) => org.personId),
      );

      if (createContestDto.type === ContestType.Meetup) {
        newCompetition.timezone = find(
          createContestDto.latitudeMicrodegrees / 1000000,
          createContestDto.longitudeMicrodegrees / 1000000,
        )[0];
      }

      if (createContestDto.compDetails?.schedule) {
        newCompetition.compDetails.schedule = await this.scheduleModel.create(createContestDto.compDetails.schedule);
      }

      await this.contestModel.create(newCompetition);

      await this.emailService.sendContestSubmittedNotification(contestCreatorEmail, newCompetition, contestUrl);

      if (!isAdmin) {
        await this.emailService.sendEmail(
          C.contactEmail,
          `A new contest has been submitted by user ${user.username}: <a href="${contestUrl}">${newCompetition.name}</a>.`,
          { subject: `New contest: ${newCompetition.name}` },
        );
      }
    } catch (err) {
      // Remove created schedule
      await this.scheduleModel.deleteMany({ competitionId: createContestDto.competitionId }).exec();

      throw new InternalServerErrorException(err.message);
    }
  }

  async updateContest(competitionId: string, updateContestDto: UpdateContestDto, user: IPartialUser) {
    // Makes sure the user is an admin or a moderator who has access rights to the UNFINISHED contest.
    // If the contest is finished and the user is not an admin, an unauthorized exception is thrown.
    // Do not exclude internal fields so that the contest can be saved.
    const contest = await this.getFullContest(competitionId, user, { ignoreState: false, exclude: false });
    const isAdmin = user.roles.includes(Role.Admin);

    // This is checked, because admins are allowed to set the address and venue as empty, but mods aren't
    if (!isAdmin) {
      this.validateContest(updateContestDto, user);
    }

    contest.organizers = await this.personsService.getPersonsById(
      updateContestDto.organizers.map((org) => org.personId),
    );
    contest.contact = updateContestDto.contact;
    contest.description = updateContestDto.description;
    contest.events = await this.updateContestEvents(contest, updateContestDto.events);

    if (updateContestDto.compDetails) {
      if (contest.compDetails) {
        if (contest.state < ContestState.Finished) {
          await this.scheduleModel.updateOne(
            { _id: contest.compDetails.schedule._id },
            updateContestDto.compDetails.schedule,
          );
        }
      }
      // compDetails might be undefined if the contest was imported
      else {
        contest.compDetails = {
          schedule: await this.scheduleModel.create(updateContestDto.compDetails.schedule),
        };
      }
    } else if (updateContestDto.meetupDetails) {
      contest.meetupDetails = updateContestDto.meetupDetails;
    }

    if (isAdmin || contest.state < ContestState.Approved) {
      contest.name = updateContestDto.name;
      if (contest.type !== ContestType.Online) {
        contest.city = updateContestDto.city;
        contest.venue = updateContestDto.venue;
        contest.address = updateContestDto.address;
      }
      if (updateContestDto.latitudeMicrodegrees && updateContestDto.longitudeMicrodegrees) {
        contest.latitudeMicrodegrees = updateContestDto.latitudeMicrodegrees;
        contest.longitudeMicrodegrees = updateContestDto.longitudeMicrodegrees;
      }
      contest.competitorLimit = updateContestDto.competitorLimit;
    }

    // Even an admin is not allowed to edit these after a comp has been approved
    if (contest.state < ContestState.Approved) {
      contest.startDate = updateContestDto.startDate;
      if (getIsCompType(contest.type)) contest.endDate = updateContestDto.endDate;
    }

    await this.saveContest(contest);
  }

  async updateState(competitionId: string, newState: ContestState, user: IPartialUser) {
    // The organizers are needed for access rights checking below
    const contest = await this.contestModel.findOne({ competitionId }).populate(orgPopulateOptions);

    await this.authService.checkAccessRightsToContest(user, contest, { ignoreState: true });

    const resultFromContest = await this.resultModel.findOne({ competitionId });
    const isAdmin = user.roles.includes(Role.Admin);
    const contestCreatorEmail = await this.usersService.getUserEmail({ _id: contest.createdBy });
    const contestUrl = this.getContestUrl(contest.competitionId);

    if (getIsCompType(contest.type) && !contest.compDetails)
      throw new BadRequestException('A competition without a schedule cannot be approved');

    // If the contest is set to approved and it already has a result, set it as ongoing, if it isn't already.
    // A contest can have results before being approved if it's an imported contest.
    if (isAdmin && resultFromContest && contest.state < ContestState.Ongoing && newState === ContestState.Approved) {
      contest.state = ContestState.Ongoing;
    }
    // Allow mods only to finish an ongoing contest
    else if (isAdmin || (contest.state === ContestState.Ongoing && newState === ContestState.Finished)) {
      contest.state = newState;

      if (newState === ContestState.Approved) {
        await this.emailService.sendEmail(
          contestCreatorEmail,
          `Your contest <a href="${contestUrl}">${contest.name}</a> has been approved and is now public on the website.`,
          { subject: `Contest approved: ${contest.name}` },
        );
      } else if (newState === ContestState.Finished) {
        const incompleteResult = await this.resultModel.findOne({ 'attempts.result': 0 }).exec();

        if (incompleteResult)
          throw new BadRequestException(`This contest has an unentered attempt in event ${incompleteResult.eventId}`);

        if (!isAdmin) {
          await this.emailService.sendEmail(
            C.contactEmail,
            `Contest <a href="${contestUrl}">${contest.name}</a> has been finished. Review the results and publish them to have them included in the rankings.`,
            { subject: `Contest finished: ${contest.name}` },
          );
        }
      }
    }

    if (isAdmin && newState === ContestState.Published) {
      this.logger.log(`Publishing contest ${contest.competitionId}...`);

      try {
        // Unset unapproved from the results so that they can be included in the rankings
        await this.resultModel.updateMany({ competitionId: contest.competitionId }, { $unset: { unapproved: '' } });

        await this.resultsService.resetRecordsCancelledByPublishedContest(contest.competitionId);

        await this.emailService.sendEmail(
          contestCreatorEmail,
          `The results of <a href="${contestUrl}">${contest.name}</a> have been published and will now enter the rankings.`,
          { subject: `Contest published: ${contest.name}` },
        );
      } catch (err) {
        throw new InternalServerErrorException(`Error while publishing contest: ${err.message}`);
      }
    }

    await this.saveContest(contest);
  }

  /////////////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////////////

  private async saveContest(contest: ContestDocument) {
    try {
      await contest.save();
    } catch (err) {
      throw new InternalServerErrorException(`Error while saving contest ${contest.competitionId}: ${err.message}`);
    }
  }

  // Finds the contest with the given competition ID with the rounds and results populated
  private async getFullContest(
    competitionId: string,
    user?: IPartialUser,
    {
      ignoreState = true,
      exclude = true,
    }: {
      ignoreState?: boolean;
      exclude?: boolean; // whether or not to exclude internal fields
    } = {
      ignoreState: true,
      exclude: true,
    },
  ): Promise<ContestDocument> {
    let contest: ContestDocument;

    try {
      contest = await this.contestModel
        // createdBy is used to check access rights below (along with organizers list), and then excluded
        .findOne({ competitionId }, exclude ? exclSysButKeepCreatedBy : {})
        .populate(eventPopulateOptions.event)
        .populate(eventPopulateOptions.rounds)
        .populate(orgPopulateOptions)
        .exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (!contest) throw new NotFoundException(`Contest with id ${competitionId} not found`);

    if (user) this.authService.checkAccessRightsToContest(user, contest, { ignoreState });
    if (exclude) contest.createdBy = undefined;

    if (contest.compDetails) {
      try {
        await contest.populate({ path: 'compDetails.schedule', model: 'Schedule' });
      } catch (err) {
        throw new InternalServerErrorException(err.message);
      }
    }

    return contest;
  }

  private async getNewContestEvent(contestEvent: IContestEvent, saveResults = false): Promise<ContestEvent> {
    const eventRounds: RoundDocument[] = [];

    try {
      for (const round of contestEvent.rounds) {
        // This is only used for the import contest feature and can only be used by an admin
        if (saveResults) {
          round.results = await this.resultModel.create(
            round.results.map((r) => ({
              ...r,
              unapproved: true,
            })),
          );
        }

        eventRounds.push(await this.roundModel.create(round));
      }
    } catch (err) {
      throw new InternalServerErrorException(`Error while creating rounds for contest: ${err.message}`);
    }

    return {
      event: await this.eventsService.getEventById(contestEvent.event.eventId),
      rounds: eventRounds,
    };
  }

  // Deletes/adds/updates contest events and rounds
  private async updateContestEvents(contest: ContestDocument, newEvents: IContestEvent[]): Promise<ContestEvent[]> {
    try {
      // Remove deleted rounds and events
      for (const contestEvent of contest.events) {
        const sameEventInNew = newEvents.find((el) => el.event.eventId === contestEvent.event.eventId);

        if (sameEventInNew) {
          for (const round of contestEvent.rounds) {
            // Delete round if it has no results
            if (round.results.length === 0 && !sameEventInNew.rounds.some((el) => el.roundId === round.roundId)) {
              await round.deleteOne();
              contestEvent.rounds = contestEvent.rounds.filter((el) => el !== round);
            }
          }
        }
        // Delete event and all of its rounds if it has no results
        else if (!contestEvent.rounds.some((el) => el.results.length > 0)) {
          for (const round of contestEvent.rounds) await round.deleteOne();
          contest.events = contest.events.filter((el) => el.event.eventId !== contestEvent.event.eventId);
        }
      }

      // Update rounds and add new events
      for (const newEvent of newEvents) {
        const sameEventInContest = contest.events.find((el) => el.event.eventId === newEvent.event.eventId);

        if (sameEventInContest) {
          for (const round of newEvent.rounds) {
            const sameRoundInContest = sameEventInContest.rounds.find((el) => el.roundId === round.roundId);

            // If the contest already has this round, update the permitted fields
            if (sameRoundInContest) {
              sameRoundInContest.roundTypeId = round.roundTypeId;

              if (sameRoundInContest.results.length === 0) {
                sameRoundInContest.format = round.format;
                sameRoundInContest.timeLimit = round.timeLimit;
                sameRoundInContest.cutoff = round.cutoff;
              }

              // Update proceed object if the updated round has it, or unset proceed if it doesn't,
              // meaning that the round became the final round due to a deletion
              if (round.proceed) sameRoundInContest.proceed = round.proceed;
              else sameRoundInContest.proceed = undefined;

              await sameRoundInContest.save();
            } else {
              // If it's a new round, add it
              sameEventInContest.rounds.push(await this.roundModel.create(round));
            }
          }
        } else {
          contest.events.push(await this.getNewContestEvent(newEvent));
        }
      }

      // Sort contest events by rank
      contest.events.sort((a, b) => a.event.rank - b.event.rank);

      return contest.events;
    } catch (err) {
      throw new InternalServerErrorException(`Error while updating contest events: ${err.message}`);
    }
  }

  private validateContest(contest: IContest, user: IPartialUser) {
    if (!contest.address) throw new BadRequestException('Please enter an address');
    if (!contest.venue) throw new BadRequestException('Please enter the venue name');
    if (!contest.organizers.some((o) => o.personId === user.personId))
      throw new BadRequestException('You cannot create a contest which you are not organizing');
  }

  private getContestUrl(competitionId: string): string {
    return `${process.env.BASE_URL}/competitions/${competitionId}`;
  }
}
