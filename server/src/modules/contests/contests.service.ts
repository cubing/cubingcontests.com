import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { addDays, differenceInDays, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { find as findTimezone } from 'geo-tz';
import { ContestDto } from './dto/contest.dto';
import { InjectModel } from '@nestjs/mongoose';
import { mongo, Model } from 'mongoose';
import { ContestEvent, ContestDocument } from '~/src/models/contest.model';
import {
  eventPopulateOptions,
  excl,
  exclSysButKeepCreatedBy,
  orgPopulateOptions,
  resultPopulateOptions,
  schedulePopulateOptions,
} from '~/src/helpers/dbHelpers';
import C from '@sh/constants';
import { IContestEvent, IContestData, IContest, IContestDto, IRound, ISchedule } from '@sh/types';
import { ContestState, ContestType, EventGroup } from '@sh/enums';
import { Role } from '@sh/enums';
import { getDateOnly, getIsCompType, getIsOtherActivity } from '@sh/sharedFunctions';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { ResultsService } from '@m/results/results.service';
import { EventsService } from '@m/events/events.service';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { PersonsService } from '@m/persons/persons.service';
import { AuthService } from '@m/auth/auth.service';
import { EmailService } from '@m/email/email.service';
import { UsersService } from '@m/users/users.service';
import { RoundDocument } from '~/src/models/round.model';
import { ResultDocument } from '~/src/models/result.model';
import { ScheduleDocument } from '~/src/models/schedule.model';
import { IPartialUser } from '~/src/helpers/interfaces/User';

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
          const [contest] = contests;

          for (let i = 0; i < s.venues.length; i++) {
            const venue = s.venues[i];

            // Check for duplicate ID venues
            if (s.venues.some((v, index) => index > i && v.id === venue.id))
              this.logger.error(`Error: contest ${contest.competitionId} has duplicate venue ID - ${venue.id}`);

            for (let j = 0; j < venue.rooms.length; j++) {
              const room = venue.rooms[j];

              // Check for duplicate ID rooms
              if (venue.rooms.some((r, index) => index > j && r.id === room.id))
                this.logger.error(`Error: contest ${contest.competitionId} has duplicate room ID - ${room.id}`);

              for (let k = 0; k < s.venues[i].rooms[j].activities.length; k++) {
                const activity = room.activities[k];

                // Check for duplicate ID rooms
                if (room.activities.some((a, index) => index > k && a.id === activity.id))
                  this.logger.error(
                    `Error: contest ${contest.competitionId} has duplicate activity ID - ${activity.id}`,
                  );

                const startTime = toZonedTime(activity.startTime, s.venues[i].timezone);
                const endTime = toZonedTime(activity.endTime, s.venues[i].timezone);

                // Check that no activity is outside of the date range of the contest
                if (startTime < contest.startDate || endTime >= addDays(contest.endDate, 1)) {
                  this.logger.error(
                    `Error: activity ${JSON.stringify(activity)} is outside of the date range of the contest ${
                      contest.competitionId
                    }`,
                  );
                }

                if (!getIsOtherActivity(activity.activityCode)) {
                  // Check that all results for this schedule activity have the right date
                  const round = await this.roundModel
                    .findOne({ competitionId: contest.competitionId, roundId: activity.activityCode })
                    .populate(resultPopulateOptions)
                    .exec();

                  if (!round) {
                    this.logger.error(
                      `Round for activity ${activity.activityCode} at contest ${contest.competitionId} not found`,
                    );
                  } else {
                    const activityDate = getDateOnly(endTime);

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
    }
  }

  async getContests(region?: string, eventId?: string): Promise<ContestDocument[]> {
    const queryFilter: any = { state: { $gt: ContestState.Created, $lt: ContestState.Removed } };
    if (region) queryFilter.countryIso2 = region;
    if (eventId) {
      const event = await this.eventsService.getEventById(eventId);
      queryFilter['events.event'] = event._id;
    }

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
        // round.populate(resultPopulateOptions);

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

  async createContest(contestDto: ContestDto, user: IPartialUser, saveResults = false) {
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

    this.validateAndCleanUpContest(contestDto, user);

    // First save all of the rounds in the DB (without any results until they get posted)
    const contestEvents: ContestEvent[] = [];

    for (const contestEvent of contestDto.events) {
      contestEvents.push(await this.getNewContestEvent(contestEvent, saveResults));
    }

    // Create new contest
    const newContest: IContest = {
      ...contestDto,
      events: contestEvents,
      createdBy: new mongo.ObjectId(user._id as string),
      state: ContestState.Created,
      participants: !saveResults ? 0 : (await this.personsService.getContestParticipants({ contestEvents })).length,
    };

    newContest.organizers = await this.personsService.getPersonsByPersonIds(
      contestDto.organizers.map((org) => org.personId),
    );

    if (contestDto.type === ContestType.Meetup) {
      newContest.timezone = findTimezone(
        contestDto.latitudeMicrodegrees / 1000000,
        contestDto.longitudeMicrodegrees / 1000000,
      )[0];
    }

    if (contestDto.compDetails?.schedule)
      newContest.compDetails.schedule = await this.scheduleModel.create(contestDto.compDetails.schedule);

    try {
      await this.contestModel.create(newContest);

      const contestUrl = getContestUrl(contestDto.competitionId);
      await this.emailService.sendContestSubmittedNotification(user.email, newContest, contestUrl);
      const prefix = differenceInDays(new Date(), newContest.startDate) < 7 ? 'URGENT! ' : '';
      // Email to the admins
      await this.emailService.sendEmail(
        C.contactEmail,
        `A new contest has been submitted by user ${user.username}: <a href="${contestUrl}">${newContest.name}</a>.`,
        { subject: `${prefix}New contest: ${newContest.shortName}` },
      );
    } catch (err) {
      // Remove created schedule
      await this.scheduleModel.deleteOne({ competitionId: contestDto.competitionId }).exec();

      throw new InternalServerErrorException(err.message);
    }
  }

  async updateContest(competitionId: string, contestDto: ContestDto, user: IPartialUser) {
    // Do not exclude internal fields so that the contest can be saved below
    const contest = await this.getFullContest(competitionId, { exclude: false });
    const isAdmin = user.roles.includes(Role.Admin);

    this.authService.checkAccessRightsToContest(user, contest);
    this.validateAndCleanUpContest(contestDto, user);

    if (contestDto.competitionId !== contest.competitionId)
      throw new BadRequestException('Changing the contest ID is not allowed');
    if (contestDto.countryIso2 !== contest.countryIso2)
      throw new BadRequestException('Changing the country is not allowed');

    contest.organizers = await this.personsService.getPersonsByPersonIds(
      contestDto.organizers.map((org) => org.personId),
    );
    contest.contact = contestDto.contact;
    contest.description = contestDto.description;
    contest.events = await this.updateContestEvents(contest, contestDto.events, isAdmin);

    if (contestDto.compDetails) {
      if (contest.compDetails) {
        await this.updateSchedule(contest, contestDto.compDetails.schedule);
      } else {
        // compDetails might be undefined if the contest was imported
        contest.compDetails = { schedule: await this.scheduleModel.create(contestDto.compDetails.schedule) };
      }
    } else if (contestDto.meetupDetails) {
      contest.meetupDetails = contestDto.meetupDetails;
    }

    if (isAdmin || contest.state < ContestState.Approved) {
      contest.name = contestDto.name;
      contest.shortName = contestDto.shortName;
      contest.city = contestDto.city;
      contest.venue = contestDto.venue;
      contest.address = contestDto.address;
      contest.latitudeMicrodegrees = contestDto.latitudeMicrodegrees;
      contest.longitudeMicrodegrees = contestDto.longitudeMicrodegrees;
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
    const contestUrl = getContestUrl(competitionId);

    if (getIsCompType(contest.type) && !contest.compDetails)
      throw new BadRequestException('A competition without a schedule cannot be approved');
    if (contest.state === newState)
      throw new BadRequestException(`The contest already has the state ${ContestState[newState]}`);

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
        await this.finishContest(contest);
      } else if (isAdmin && newState === ContestState.Published) {
        await this.publishContest(contest, contestCreatorEmail);
      }
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

    const contestCreatorEmail = await this.usersService.getUserEmail({ _id: contest.createdBy });
    await this.emailService.sendEmail(contestCreatorEmail, `Your contest ${contest.name} has been removed.`, {
      subject: 'Contest removed',
    });
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

  // Finds the contest with the given contest ID with the rounds and results populated
  async getFullContest(
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

    if (contest.compDetails) await contest.populate(schedulePopulateOptions);

    return contest;
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

  // Deletes/adds/updates contest events and rounds. This assumes that access rights have already been checked,
  // so it only makes further checks for admin-only features for when the contest hasn't been finished yet.
  private async updateContestEvents(
    contest: ContestDocument,
    newEvents: IContestEvent[],
    isAdmin: boolean,
  ): Promise<ContestEvent[]> {
    // Remove deleted rounds and events
    for (const contestEvent of contest.events) {
      const sameEventInNew = newEvents.find((el) => el.event.eventId === contestEvent.event.eventId);

      if (sameEventInNew) {
        for (const round of contestEvent.rounds) {
          // Delete round if it has no results
          if (!sameEventInNew.rounds.some((el) => el.roundId === round.roundId)) {
            if (round.results.length === 0) {
              await round.deleteOne();
              contestEvent.rounds = contestEvent.rounds.filter((el) => el !== round);
            } else {
              throw new BadRequestException(
                'You may not delete a round that has results. Please reload and try again.',
              );
            }
          }
        }
      }
      // Delete event and all of its rounds if it has no results
      else if (!contestEvent.rounds.some((el) => el.results.length > 0)) {
        for (const round of contestEvent.rounds) await round.deleteOne();
        contest.events = contest.events.filter((el) => el.event.eventId !== contestEvent.event.eventId);
      } else {
        throw new BadRequestException(
          'You may not delete an event that has rounds with results. Please reload and try again.',
        );
      }
    }

    // Update rounds and add new events
    for (const newEvent of newEvents) {
      const sameEventInContest = contest.events.find((ce) => ce.event.eventId === newEvent.event.eventId);

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
            } else if (round.format !== sameRoundInContest.format) {
              throw new BadRequestException('You may not change the format of a round that has results');
            } else if (JSON.stringify(round.timeLimit) !== JSON.stringify(sameRoundInContest.timeLimit)) {
              throw new BadRequestException('You may not change the time limit of a round that has results');
            } else if (JSON.stringify(round.cutoff) !== JSON.stringify(sameRoundInContest.cutoff)) {
              throw new BadRequestException('You may not change the cutoff of a round that has results');
            }

            // Update proceed object if the updated round has it, or unset proceed if it doesn't,
            // meaning that the round became the final round due to a deletion
            if (round.proceed) sameRoundInContest.proceed = round.proceed;
            else sameRoundInContest.proceed = undefined;

            await sameRoundInContest.save();
          }
          // If it's a new round, add it
          else {
            const newRound = await this.roundModel.create(round);
            // For WHATEVER REASON simply doing rounds.push() doesn't work here since some version of Mongoose
            sameEventInContest.rounds = [...sameEventInContest.rounds, newRound];
          }
        }
      } else if (isAdmin || contest.state < ContestState.Approved || contest.type === ContestType.Meetup) {
        // If it's a new event, add it
        contest.events.push(await this.getNewContestEvent(newEvent));
      } else {
        throw new BadRequestException('You are unauthorized to add an event to an approved competition');
      }
    }

    // Sort contest events by rank
    contest.events.sort((a, b) => a.event.rank - b.event.rank);

    return contest.events;
  }

  private async updateSchedule(contest: ContestDocument, newSchedule: ISchedule) {
    for (const venue of newSchedule.venues) {
      const sameVenueInContest = contest.compDetails.schedule.venues.find((v) => v.id === venue.id);
      if (!sameVenueInContest) throw new BadRequestException(`Schedule venue with ID ${venue.id} not found`);

      sameVenueInContest.name = venue.name;
      sameVenueInContest.latitudeMicrodegrees = venue.latitudeMicrodegrees;
      sameVenueInContest.longitudeMicrodegrees = venue.longitudeMicrodegrees;
      sameVenueInContest.timezone = venue.timezone; // this is set in validateAndCleanUpContest

      if (sameVenueInContest.rooms.some((r1) => !venue.rooms.some((r2) => r2.id === r1.id)))
        throw new NotImplementedException('Removing rooms is not supported yet');

      for (const room of venue.rooms) {
        const sameRoom = sameVenueInContest.rooms.find((r) => r.id === room.id);

        if (sameRoom) {
          sameRoom.name = room.name;
          sameRoom.color = room.color;
          // Remove deleted activities
          sameRoom.activities = sameRoom.activities.filter((a1) => room.activities.some((a2) => a2.id === a1.id));

          // Update activities
          for (const activity of room.activities) {
            const sameActivity = sameRoom.activities.find((a) => a.id === activity.id);

            if (sameActivity) {
              if (sameActivity.activityCode !== activity.activityCode)
                throw new BadRequestException('You may not edit a schedule activity code');

              if (sameActivity.activityCode === 'other-misc') {
                sameActivity.name = activity.name;
              } else {
                let round: IRound;
                for (const contestEvent of contest.events) {
                  round = contestEvent.rounds.find((r) => r.roundId === sameActivity.activityCode);
                  if (round) break;
                }
                const startTimeChanged = new Date(activity.startTime).getTime() !== sameActivity.startTime.getTime();
                const endTimeChanged = new Date(activity.endTime).getTime() !== sameActivity.endTime.getTime();
                if (round.results.length > 0 && (startTimeChanged || endTimeChanged))
                  throw new BadRequestException('You may not edit the activity for a round that has results');
              }

              sameActivity.startTime = activity.startTime;
              sameActivity.endTime = activity.endTime;
            } else {
              // If it's a new activity, add it
              sameRoom.activities.push(activity);
            }
          }
        } else {
          // If it's a new room, add it
          sameVenueInContest.rooms.push(room);
        }
      }
    }

    await contest.compDetails.schedule.save();
  }

  private validateAndCleanUpContest(contest: IContestDto, user: IPartialUser) {
    if (contest.startDate > contest.endDate)
      throw new BadRequestException('The start date must be before the end date');

    // Validation for WCA competitions and unofficial competitions
    if (contest.compDetails) {
      const roundIds = new Set<string>();

      for (const contestEvent of contest.events) {
        if (contest.type === ContestType.WcaComp && contestEvent.event.groups.includes(EventGroup.WCA))
          throw new BadRequestException(
            'WCA events may not be added for the WCA Competition contest type. They must be held through the WCA website only.',
          );

        for (const round of contestEvent.rounds) {
          let isRoundActivityFound = false;
          for (const venue of contest.compDetails.schedule.venues) {
            isRoundActivityFound = venue.rooms.some((r) => r.activities.some((a) => a.activityCode === round.roundId));
            if (isRoundActivityFound) break;
          }
          if (!isRoundActivityFound) throw new BadRequestException('Please add all rounds to the schedule');

          if (roundIds.has(round.roundId)) throw new BadRequestException(`Duplicate round found: ${round.roundId}`);
          roundIds.add(round.roundId); // used below in schedule validation
        }
      }

      // Schedule validation
      const venues = new Set<number>();
      let rooms = new Set<number>();
      let activities = new Set<number>();
      let activityCodes = new Set<string>();

      for (const venue of contest.compDetails.schedule.venues) {
        if (venue.countryIso2 !== contest.countryIso2)
          throw new BadRequestException('The schedule may not have a country different from the contest country');

        if (venues.has(venue.id)) throw new BadRequestException(`Duplicate venue ID found: ${venue.id}`);
        venues.add(venue.id);

        venue.timezone = findTimezone(venue.latitudeMicrodegrees / 1000000, venue.longitudeMicrodegrees / 1000000)[0];

        for (const room of venue.rooms) {
          if (rooms.has(room.id)) throw new BadRequestException(`Duplicate room ID found: ${room.id}`);
          rooms.add(room.id);

          for (const activity of room.activities) {
            if (activities.has(activity.id))
              throw new BadRequestException(`Duplicate activity ID found: ${activity.id}`);
            activities.add(activity.id);

            if (!getIsOtherActivity(activity.activityCode)) {
              if (!roundIds.has(activity.activityCode))
                throw new BadRequestException(`Activity ${activity.activityCode} does not have a corresponding round`);

              if (activityCodes.has(activity.activityCode))
                throw new BadRequestException(`Duplicate activity code found: ${activity.activityCode}`);
            }

            activityCodes.add(activity.activityCode);

            const zonedStartTime = toZonedTime(activity.startTime, venue.timezone).getTime();
            if (zonedStartTime < new Date(contest.startDate).getTime())
              throw new BadRequestException('An activity may not start before the start date');
            const zonedEndTime = toZonedTime(activity.endTime, venue.timezone).getTime();
            if (zonedEndTime > endOfDay(new Date(contest.endDate)).getTime())
              throw new BadRequestException('An activity may not end after the end date');
            if (zonedStartTime === zonedEndTime)
              throw new BadRequestException('An activity may not start and end at the same time');
            if (zonedStartTime > zonedEndTime)
              throw new BadRequestException('An activity start time may not be after the end time');
          }

          activities = new Set();
          activityCodes = new Set();
        }

        rooms = new Set();
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

  private async finishContest(contest: ContestDocument) {
    if (contest.type !== ContestType.WcaComp && contest.participants < C.minCompetitorsForNonWca) {
      throw new BadRequestException(
        `A meetup or unofficial competition may not have fewer than ${C.minCompetitorsForNonWca} competitors`,
      );
    }

    // Check there are no rounds with no results
    const zeroResultsRound = await this.roundModel
      .findOne({ competitionId: contest.competitionId, results: { $size: 0 } })
      .exec();

    if (zeroResultsRound) {
      const [eventId, roundNumber] = zeroResultsRound.roundId.split('-');
      const event = await this.eventsService.getEventById(eventId);
      throw new BadRequestException(`${event.name} round ${roundNumber.slice(1)} has no results`);
    }

    // Check there are no incomplete results
    const incompleteResult = await this.resultModel
      .findOne({ competitionId: contest.competitionId, 'attempts.result': 0 })
      .exec();
    if (incompleteResult) {
      const event = await this.eventsService.getEventById(incompleteResult.eventId);
      throw new BadRequestException(`This contest has an unentered attempt in ${event.name}`);
    }

    const dnsOnlyResult = await this.resultModel
      .findOne({ competitionId: contest.competitionId, attempts: { $not: { $elemMatch: { result: { $ne: -2 } } } } })
      .exec();
    if (dnsOnlyResult) {
      throw new BadRequestException(
        `This contest has a result with only DNS attempts in event ${
          (await this.eventsService.getEventById(dnsOnlyResult.eventId)).name
        }`,
      );
    }

    // If there are no issues, finish the contest and send the admins an email
    contest.queuePosition = undefined;

    const contestUrl = getContestUrl(contest.competitionId);
    await this.emailService.sendEmail(
      C.contactEmail,
      `Contest <a href="${contestUrl}">${contest.name}</a> has been finished. Review the results and publish them to have them included in the rankings.`,
      { subject: `Contest finished: ${contest.shortName}` },
    );
  }

  private async publishContest(contest: ContestDocument, contestCreatorEmail: string) {
    this.logger.log(`Publishing contest ${contest.competitionId}...`);

    if (contest.type === ContestType.WcaComp) {
      const response = await fetch(
        `https://www.worldcubeassociation.org/api/v0/competitions/${contest.competitionId}/results`,
      );
      const data = await response.json();
      if (!data || data.length === 0) {
        throw new BadRequestException(
          'You must wait until the results have been published on the WCA website before publishing it',
        );
      }
    }

    // Unset unapproved from the results so that they can be included in the rankings
    await this.resultModel.updateMany({ competitionId: contest.competitionId }, { $unset: { unapproved: '' } });

    await this.personsService.approvePersons({ competitionId: contest.competitionId });

    const contestUrl = getContestUrl(contest.competitionId);
    await this.emailService.sendEmail(
      contestCreatorEmail,
      `The results of <a href="${contestUrl}">${contest.name}</a> have been published and will now enter the rankings.`,
      { subject: `Contest published: ${contest.shortName}` },
    );
  }
}
