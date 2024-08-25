import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { find } from 'geo-tz';
import { addDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ContestDto } from './dto/contest.dto';
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
import { IContestEvent, IContestData, IContest, IContestDto, IRound } from '@sh/types';
import { ContestState, ContestType } from '@sh/enums';
import { Role } from '@sh/enums';
import { ScheduleDocument } from '~/src/models/schedule.model';
import { IPartialUser } from '~/src/helpers/interfaces/User';
import { MyLogger } from '~/src/modules/my-logger/my-logger.service';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '@m/email/email.service';
import { UsersService } from '@m/users/users.service';
import { getDateOnly, getIsCompType } from '@sh/sharedFunctions';

const getContestUrl = (competitionId: string): string => `${process.env.BASE_URL}/competitions/${competitionId}`;

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
                const startTime = toZonedTime(activity.startTime, venue.timezone);
                const endTime = toZonedTime(activity.endTime, venue.timezone);

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
        .populate(eventPopulateOptions.roundsAndResults)
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
    const queryFilter: any = { state: { $gt: ContestState.Created, $lt: ContestState.Removed } };
    if (region) queryFilter.countryIso2 = region;

    const contests = await this.contestModel.find(queryFilter, excl).sort({ startDate: -1 }).exec();
    return contests;
  }

  async getModContests(user: IPartialUser): Promise<IContest[]> {
    let queryFilter: any = {};

    // Check access rights
    if (!user.roles.includes(Role.Admin)) {
      const person = await this.personsService.getPersonByPersonId(user.personId, {
        customError: 'Your profile must be tied to your account before you can use moderator features',
      });
      queryFilter = { organizers: (person as any)._id };
    }

    const contests = await this.contestModel.find(queryFilter, excl).sort({ startDate: -1 }).exec();
    return contests;
  }

  // If eventId is defined, this will include the results for that event in the response
  async getContest(
    competitionId: string,
    { user, eventId }: { user?: IPartialUser; eventId?: string },
  ): Promise<IContestData> {
    // This needs to be a plain object for the manual results population below
    const contest = await this.getFullContest(competitionId);

    if (user) this.authService.checkAccessRightsToContest(user, contest);

    const activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });
    const output: IContestData = {
      contest,
      persons: await this.personsService.getContestParticipants({ competitionId }),
      activeRecordTypes,
    };

    if (eventId) {
      output.contest = contest.toObject(); // TEMP SOLUTION! (figure out the results population below instead of doing this workaround)
      const contestEvent =
        eventId === 'FIRST_EVENT'
          ? output.contest.events[0]
          : output.contest.events.find((ce) => ce.event.eventId === eventId);
      if (!contestEvent) throw new BadRequestException('Event not found');

      // Populate the results of all rounds for this event
      for (const round of contestEvent.rounds) {
        // round.populate(eventPopulateOptions.roundsAndResults.populate);

        for (let i = 0; i < round.results.length; i++)
          round.results[i] = await this.resultModel.findById(round.results[i].toString());
      }
    }

    // Get mod contest
    if (user) {
      output.recordPairsByEvent = await this.resultsService.getRecordPairs(
        contest.events.map((el) => el.event),
        contest.startDate,
        { activeRecordTypes },
      );

      // Show admins the info about the creator of the contest
      if (user.roles.includes(Role.Admin))
        output.creator = await this.usersService.getUserDetails(contest.createdBy.toString(), false);
    }

    return output;
  }

  // Create new contest, if one with that ID doesn't already exist
  async createContest(
    contestDto: ContestDto,
    { user, saveResults = false }: { user: IPartialUser; saveResults: boolean },
  ) {
    const isAdmin = user.roles.includes(Role.Admin);
    const contestUrl = getContestUrl(contestDto.competitionId);

    // Only admins are allowed to import contests and have the results immediately saved
    if (!isAdmin) saveResults = false;

    this.validateContest(contestDto, user);

    // No need to check that the state is not removed, because removed contests have _REMOVED at the end anyways
    const sameIdC = await this.contestModel.findOne({ competitionId: contestDto.competitionId }).exec();
    if (sameIdC) throw new BadRequestException(`A contest with the ID ${contestDto.competitionId} already exists`);
    const sameNameC = await this.contestModel
      .findOne({ name: contestDto.name, state: { $ne: ContestState.Removed } })
      .exec();
    if (sameNameC) throw new BadRequestException(`A contest with the name ${contestDto.name} already exists`);
    const sameShortC = await this.contestModel
      .findOne({ shortName: contestDto.shortName, state: { $ne: ContestState.Removed } })
      .exec();
    if (sameShortC)
      throw new BadRequestException(`A contest with the short name ${contestDto.shortName} already exists`);

    try {
      // First save all of the rounds in the DB (without any results until they get posted)
      const contestEvents: ContestEvent[] = [];
      const contestCreatorEmail = await this.usersService.getUserEmail({ _id: user._id });

      for (const contestEvent of contestDto.events) {
        contestEvents.push(await this.getNewContestEvent(contestEvent, saveResults));
      }

      // Create new contest
      const newCompetition: IContest = {
        ...contestDto,
        events: contestEvents,
        createdBy: new mongoose.Types.ObjectId(user._id as string),
        state: ContestState.Created,
        participants: !saveResults ? 0 : (await this.personsService.getContestParticipants({ contestEvents })).length,
      };

      newCompetition.organizers = await this.personsService.getPersonsByPersonIds(
        contestDto.organizers.map((org) => org.personId),
      );

      if (contestDto.type === ContestType.Meetup) {
        newCompetition.timezone = find(
          contestDto.latitudeMicrodegrees / 1000000,
          contestDto.longitudeMicrodegrees / 1000000,
        )[0];
      }

      if (contestDto.compDetails?.schedule) {
        newCompetition.compDetails.schedule = await this.scheduleModel.create(contestDto.compDetails.schedule);
      }

      await this.contestModel.create(newCompetition);

      await this.emailService.sendContestSubmittedNotification(contestCreatorEmail, newCompetition, contestUrl);

      if (!isAdmin) {
        await this.emailService.sendEmail(
          C.contactEmail,
          `A new contest has been submitted by user ${user.username}: <a href="${contestUrl}">${newCompetition.name}</a>.`,
          { subject: `New contest: ${newCompetition.shortName}` },
        );
      }
    } catch (err) {
      // Remove created schedule
      await this.scheduleModel.deleteOne({ competitionId: contestDto.competitionId }).exec();

      throw new InternalServerErrorException(err.message);
    }
  }

  async updateContest(competitionId: string, contestDto: ContestDto, user: IPartialUser) {
    // Do not exclude internal fields so that the contest can be saved below
    const contest = await this.getFullContest(competitionId, { exclude: false });

    this.authService.checkAccessRightsToContest(user, contest);
    this.validateContest(contestDto, user);

    contest.organizers = await this.personsService.getPersonsByPersonIds(
      contestDto.organizers.map((org) => org.personId),
    );
    contest.contact = contestDto.contact;
    contest.description = contestDto.description;
    contest.events = await this.updateContestEvents(contest, contestDto.events);

    const isAdmin = user.roles.includes(Role.Admin);

    if (contestDto.compDetails) {
      if (contest.compDetails) {
        if (isAdmin || contest.state < ContestState.Finished) {
          await this.scheduleModel.updateOne(
            { _id: contest.compDetails.schedule._id },
            contestDto.compDetails.schedule,
          );
        }
      }
      // compDetails might be undefined if the contest was imported
      else {
        contest.compDetails = {
          schedule: await this.scheduleModel.create(contestDto.compDetails.schedule),
        };
      }
    } else if (contestDto.meetupDetails) {
      contest.meetupDetails = contestDto.meetupDetails;
    }

    if (isAdmin || contest.state < ContestState.Approved) {
      contest.name = contestDto.name;
      contest.shortName = contestDto.shortName;
      if (contest.type !== ContestType.Online) {
        contest.city = contestDto.city;
        contest.venue = contestDto.venue;
        contest.address = contestDto.address;
      }
      if (contestDto.latitudeMicrodegrees && contestDto.longitudeMicrodegrees) {
        contest.latitudeMicrodegrees = contestDto.latitudeMicrodegrees;
        contest.longitudeMicrodegrees = contestDto.longitudeMicrodegrees;
      }
      contest.competitorLimit = contestDto.competitorLimit;
    }

    // Even an admin is not allowed to edit these after a comp has been approved
    if (contest.state < ContestState.Approved) {
      contest.startDate = contestDto.startDate;
      if (getIsCompType(contest.type)) contest.endDate = contestDto.endDate;
    }

    await contest.save();
  }

  async updateState(competitionId: string, newState: ContestState, user: IPartialUser) {
    // The organizers are needed for access rights checking below
    const contest = await this.contestModel.findOne({ competitionId }).populate(orgPopulateOptions);
    if (!contest) throw new NotFoundException(`Contest with ID ${competitionId} not found`);

    await this.authService.checkAccessRightsToContest(user, contest);

    const resultFromContest = await this.resultModel.findOne({ competitionId });
    const isAdmin = user.roles.includes(Role.Admin);
    const contestCreatorEmail = await this.usersService.getUserEmail({ _id: contest.createdBy });
    const contestUrl = getContestUrl(contest.competitionId);

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
          { subject: `Contest approved: ${contest.shortName}` },
        );
      } else if (newState === ContestState.Finished) {
        const incompleteResult = await this.resultModel.findOne({ 'attempts.result': 0 }).exec();

        if (incompleteResult)
          throw new BadRequestException(`This contest has an unentered attempt in event ${incompleteResult.eventId}`);

        contest.queuePosition = undefined;

        if (!isAdmin) {
          await this.emailService.sendEmail(
            C.contactEmail,
            `Contest <a href="${contestUrl}">${contest.name}</a> has been finished. Review the results and publish them to have them included in the rankings.`,
            { subject: `Contest finished: ${contest.shortName}` },
          );
        }
      }
    }

    if (isAdmin && newState === ContestState.Published) {
      this.logger.log(`Publishing contest ${contest.competitionId}...`);

      if (contest.participants < C.minCompetitorsForUnofficialCompsAndMeetups) {
        throw new BadRequestException(
          `A meetup or unofficial competition may not have fewer than ${C.minCompetitorsForUnofficialCompsAndMeetups} competitors`,
        );
      }

      // Unset unapproved from the results so that they can be included in the rankings
      await this.resultModel.updateMany({ competitionId: contest.competitionId }, { $unset: { unapproved: '' } });

      await this.emailService.sendEmail(
        contestCreatorEmail,
        `The results of <a href="${contestUrl}">${contest.name}</a> have been published and will now enter the rankings.`,
        { subject: `Contest published: ${contest.shortName}` },
      );
    }

    await contest.save();

    // Return the updated contest without system fields
    return await this.contestModel.findOne({ competitionId }, excl).exec();
  }

  async deleteContest(competitionId: string, user: IPartialUser) {
    const contest = await this.getPartialContestAndCheckAccessRights(competitionId, user);

    if (contest.participants > 0) throw new BadRequestException('You may not remove a contest that has results');

    contest.state = ContestState.Removed;
    contest.competitionId += '_REMOVED';

    await contest.save();

    await this.scheduleModel.updateOne({ competitionId }, { $set: { competitionId: contest.competitionId } }).exec();
    await this.roundModel.updateMany({ competitionId }, { $set: { competitionId: contest.competitionId } }).exec();
    await this.authService.deleteAuthToken(competitionId);
  }

  async enableQueue(competitionId: string, user: IPartialUser) {
    const contest = await this.getPartialContestAndCheckAccessRights(competitionId, user);
    contest.queuePosition = 1;
    await contest.save();
  }

  async changeQueuePosition(
    competitionId: string,
    user: IPartialUser,
    { newPosition, difference }: { newPosition?: number; difference?: 1 | -1 },
  ) {
    const contest = await this.getPartialContestAndCheckAccessRights(competitionId, user);

    if (newPosition !== undefined) contest.queuePosition = newPosition;
    else contest.queuePosition += difference;

    if (contest.queuePosition < 0) throw new BadRequestException('Queue position may not be lower than 0');

    await contest.save();
    return contest.queuePosition;
  }

  // Used by external APIs, so access rights aren't checked here, they're checked in app.service.ts with an API key
  async getContestRound(competitionId: string, eventId: string, roundNumber: number): Promise<IRound> {
    const contest = await this.getFullContest(competitionId, { populateResults: true });
    if (contest.state === ContestState.Removed) throw new BadRequestException('This contest has been removed');
    if (contest.state > ContestState.Ongoing) throw new BadRequestException('The contest is finished');

    const contestEvent = contest.events.find((e) => e.event.eventId === eventId);
    if (!contestEvent) throw new NotFoundException(`Event with ID ${eventId} not found for the given competition`);

    const round = contestEvent.rounds[roundNumber - 1];
    if (!round) throw new BadRequestException(`Round number ${roundNumber} not found`);

    return round;
  }

  /////////////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////////////

  private async getPartialContestAndCheckAccessRights(competitionId: string, user: IPartialUser) {
    const contest = await this.contestModel.findOne({ competitionId }).exec();

    if (!contest) throw new NotFoundException(`Contest with ID ${competitionId} not found`);
    this.authService.checkAccessRightsToContest(user, contest);

    return contest;
  }

  // Finds the contest with the given competition ID with the rounds and results populated
  private async getFullContest(
    competitionId: string,
    {
      exclude = true,
      populateResults,
    }: {
      exclude?: boolean; // whether or not to exclude internal fields
      populateResults?: boolean;
    } = { exclude: true },
  ): Promise<ContestDocument> {
    const contest = await this.contestModel
      .findOne({ competitionId }, exclude ? exclSysButKeepCreatedBy : {})
      .populate(eventPopulateOptions.event)
      .populate(populateResults ? eventPopulateOptions.roundsAndResults : eventPopulateOptions.rounds)
      .populate(orgPopulateOptions)
      .exec();

    if (!contest) throw new NotFoundException(`Contest with ID ${competitionId} not found`);

    if (contest.compDetails) await contest.populate({ path: 'compDetails.schedule', model: 'Schedule' });

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

  private validateContest(contest: IContestDto, user: IPartialUser) {
    if (contest.startDate > contest.endDate)
      throw new BadRequestException('The start date must be before the end date');

    // Validation for WCA competitions and unofficial competitions
    if (contest.compDetails) {
      for (const contestEvent of contest.events) {
        for (const round of contestEvent.rounds) {
          let isRoundActivityFound = false;
          for (const venue of contest.compDetails.schedule.venues) {
            isRoundActivityFound = venue.rooms.some((r) => r.activities.some((a) => a.activityCode === round.roundId));
            if (isRoundActivityFound) break;
          }
          if (!isRoundActivityFound) throw new BadRequestException('Please add all rounds to the schedule');
        }
      }
    }

    // Disallow mods to make admin-only edits
    if (!user.roles.includes(Role.Admin)) {
      if (!contest.address) throw new BadRequestException('Please enter an address');
      if (!contest.venue) throw new BadRequestException('Please enter the venue name');
      if (!contest.organizers.some((o) => o.personId === user.personId))
        throw new BadRequestException('You cannot create a contest which you are not organizing');
    }
  }
}
