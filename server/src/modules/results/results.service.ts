import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { toZonedTime } from 'date-fns-tz';
import { InjectModel } from '@nestjs/mongoose';
import { mongo, Model } from 'mongoose';
import { ResultDocument } from '~/src/models/result.model';
import { ContestDocument } from '~/src/models/contest.model';
import { RoundDocument } from '~/src/models/round.model';
import { EventDocument } from '~/src/models/event.model';
import { ScheduleDocument } from '~/src/models/schedule.model';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { EventsService } from '@m/events/events.service';
import { PersonsService } from '@m/persons/persons.service';
import { AuthService } from '@m/auth/auth.service';
import { UsersService } from '@m/users/users.service';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { CreateResultDto } from './dto/create-result.dto';
import { SubmitResultDto } from './dto/submit-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { excl, exclSysButKeepCreatedBy, orgPopulateOptions, resultPopulateOptions } from '~/src/helpers/dbHelpers';
import C from '@sh/constants';
import { ContestState, Role, RoundFormat, WcaRecordType } from '@sh/enums';
import { roundFormats } from '@sh/roundFormats';
import {
  IEventRankings,
  IRecordType,
  IRecordPair,
  IEventRecordPairs,
  IResultsSubmissionInfo,
  IRanking,
  IEvent,
  IFeResult,
  IActivity,
  IResult,
  IRound,
} from '@sh/types';
import { IPartialUser } from '~/src/helpers/interfaces/User';
import {
  compareAvgs,
  compareSingles,
  getBestAndAverage,
  getDateOnly,
  getFormattedTime,
  getIsCompType,
  getMakesCutoff,
  getRoundRanksWithAverage,
  setResultRecords,
} from '@sh/sharedFunctions';
import { setRankings, getBaseSinglesFilter, getBaseAvgsFilter } from '~/src/helpers/utilityFunctions';
import { EmailService } from '~/src/modules/email/email.service';

@Injectable()
export class ResultsService {
  constructor(
    private readonly logger: MyLogger,
    private readonly eventsService: EventsService,
    private readonly recordTypesService: RecordTypesService,
    private readonly personsService: PersonsService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    @InjectModel('Result') private readonly resultModel: Model<ResultDocument>,
    @InjectModel('Round') private readonly roundModel: Model<RoundDocument>,
    @InjectModel('Competition') private readonly contestModel: Model<ContestDocument>,
    @InjectModel('Schedule') private readonly scheduleModel: Model<ScheduleDocument>,
  ) {}

  async onModuleInit() {
    if (process.env.DO_DB_CONSISTENCY_CHECKS === 'true') {
      this.logger.log('Checking results inconsistencies in the DB...');

      // Look for orphan contest results or ones that somehow belong to multiple rounds
      const contestResults = await this.resultModel.find({ competitionId: { $exists: true } }).exec();
      for (const res of contestResults) {
        const rounds = await this.roundModel.find({ results: res._id }).exec();

        if (rounds.length === 0) this.logger.error(`Error: contest result has no round: ${res}`);
        else if (rounds.length > 1) this.logger.error(`Error: result ${res} belongs to multiple rounds: ${rounds}`);
      }

      // Look for records that are worse than a previous result
      const events = await this.eventsService.getEvents({ includeHidden: true });
      for (const event of events) {
        // Single records
        const singleRecordResults = await this.resultModel
          .find({ eventId: event.eventId, regionalSingleRecord: 'WR' })
          .exec();

        for (const result of singleRecordResults) {
          const betterSinglesInThePast = await this.resultModel
            .find({
              ...getBaseSinglesFilter(event, { $lt: result.best, $gt: 0 }),
              date: { $lte: result.date },
              unapproved: { $exists: false },
            })
            .exec();
          if (betterSinglesInThePast.length > 0) {
            this.logger.error(
              `${result.eventId} single WR ${result} is worse than these results: ${betterSinglesInThePast}`,
            );
          }
        }

        // Average records
        const averageRecordResults = await this.resultModel
          .find({ eventId: event.eventId, regionalAverageRecord: 'WR' })
          .exec();

        for (const result of averageRecordResults) {
          const betterAvgsInThePast = await this.resultModel
            .find({
              ...getBaseAvgsFilter(event, { $lt: result.average, $gt: 0 }),
              date: { $lte: result.date },
              unapproved: { $exists: false },
            })
            .exec();
          if (betterAvgsInThePast.length > 0) {
            this.logger.error(
              `${result.eventId} average WR ${result} is worse than these results: ${betterAvgsInThePast}`,
            );
          }
        }
      }

      const rounds = await this.roundModel.find().populate(resultPopulateOptions).exec();
      for (const round of rounds) {
        const contests = await this.contestModel.find({ 'events.rounds': round._id }).exec();

        // Look for orphan rounds or ones that belong to multiple contests
        if (contests.length === 0) {
          this.logger.error(`Error: round has no contest: ${round}`);
        } else if (contests.length > 1) {
          this.logger.error(`Error: round ${round} belongs to multiple contests: ${contests}`);
        }
        // Check if the round has no results
        else if (
          round.results.length === 0 &&
          contests[0].state >= ContestState.Finished &&
          contests[0].state !== ContestState.Removed
        ) {
          this.logger.error(`Error: round has no results: ${round}`);
        } else {
          // Look for results with empty attempts
          for (const result of round.results) {
            if (result.attempts.some((a) => a.result === 0))
              this.logger.error(`Error: result ${result._id} has an empty attempt`);

            const roundFormat = roundFormats.find((rf) => rf.value === round.format);
            const makesCutoff = getMakesCutoff(result.attempts, round.cutoff);
            if (
              (makesCutoff && result.attempts.length !== roundFormat.attempts) ||
              (!makesCutoff && result.attempts.length !== round.cutoff.numberOfAttempts)
            )
              this.logger.error(`Error: result ${result} has the wrong number of attempts`);
          }
        }
      }

      // Look for duplicate video links (ignoring the ones that are intentionally repeated in the production DB)
      let knownDuplicates = [
        '',
        'https://www.youtube.com/watch?v=3MfyECPWhms',
        'https://www.youtube.com/watch?v=h4T55MftnRc',
        'https://www.youtube.com/watch?v=YYKOlLgQigA',
        'https://youtu.be/kD7HLIMAy0Y',
        'https://youtu.be/Z-NczuQ-7Og',
        'https://youtu.be/6SZZ5GFJEqc',
        'https://youtu.be/5yHJEphVmGw',
        'https://youtu.be/kJe39nKlNZE',
        'https://www.youtube.com/watch?v=DEfccjzzpbM',
        'https://youtu.be/5cWf4jnik4A',
      ];
      const repeatedVideoLinks = await this.resultModel.aggregate([
        { $match: { videoLink: { $exists: true, $nin: knownDuplicates } } },
        { $group: { _id: '$videoLink', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
      ]);
      if (repeatedVideoLinks.length > 0) {
        this.logger.error(
          `These video links have multiple results: ${repeatedVideoLinks
            .map((x) => `${x._id || '[blank]'} (${x.count})`)
            .join(', ')}`,
        );
      }

      // Look for duplicate discussion links
      knownDuplicates = [
        'https://www.speedsolving.com/forum/threads/6x6-blindfolded-rankings-thread.41968/page-11#post-1212891',
        'https://www.speedsolving.com/threads/6x6-blindfolded-rankings-thread.41968/post-1345821',
        'https://www.speedsolving.com/threads/6x6-blindfolded-rankings-thread.41968/page-31#post-1426321',
        'https://www.speedsolving.com/threads/6x6-blindfolded-rankings-thread.41968/post-1384930',
        'https://www.speedsolving.com/threads/6x6-blindfolded-rankings-thread.41968/page-34#post-1512606',
        'https://www.speedsolving.com/threads/6x6-blindfolded-rankings-thread.41968/page-31#post-1424699',
        'https://www.speedsolving.com/threads/6x6-blindfolded-rankings-thread.41968/post-1563025',
      ];
      const repeatedDiscussionLinks = await this.resultModel.aggregate([
        { $match: { discussionLink: { $exists: true, $nin: knownDuplicates } } },
        { $group: { _id: '$discussionLink', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
      ]);
      if (repeatedDiscussionLinks.length > 0) {
        this.logger.error(
          `These discussion links have multiple results: ${repeatedDiscussionLinks
            .map((x) => `${x._id} (${x.count})`)
            .join(', ')}`,
        );
      }

      // Look for results with invalid date
      const results = await this.resultModel.find().exec();

      for (const result of results) {
        if (
          result.date.getUTCHours() !== 0 ||
          result.date.getUTCMinutes() !== 0 ||
          result.date.getUTCSeconds() !== 0 ||
          result.date.getUTCMilliseconds() !== 0
        )
          this.logger.error(
            `Result ${result._id} from competition ${
              result.competitionId
            } has invalid date: ${result.date.toUTCString()}`,
          );
      }

      // Look for results with average when they shouldn't have one
      const falseAverageResults1 = await this.resultModel.find({ attempts: { $size: 1 }, average: { $ne: 0 } }).exec();

      for (const result of falseAverageResults1)
        this.logger.error(`Result ${result._id} has an average despite having one attempt`);

      const falseAverageResults2 = await this.resultModel.find({ attempts: { $size: 2 }, average: { $ne: 0 } }).exec();

      for (const result of falseAverageResults2)
        this.logger.error(`Result ${result._id} has an average despite having two attempts`);
    }
  }

  async getRankings(eventId: string, forAverage = false, show?: 'results'): Promise<IEventRankings> {
    const event = await this.eventsService.getEventById(eventId);

    const eventRankings: IEventRankings = {
      event,
      rankings: [],
    };
    let eventResults: ResultDocument[] = [];

    if (!forAverage) {
      const $match = { ...getBaseSinglesFilter(event), unapproved: { $exists: false } };

      if (show === 'results') {
        // Get all top single results
        eventResults = await this.resultModel
          .aggregate([
            { $match },
            { $unwind: { path: '$attempts', includeArrayIndex: 'attemptNumber' } },
            { $project: excl },
            { $match: { 'attempts.result': { $gt: 0, $ne: C.maxTime } } },
            { $sort: { 'attempts.result': 1 } },
          ])
          .exec();

        // This is necessary for setRankings to work correctly
        for (const res of eventResults) res.best = (res.attempts as any).result;
      } else {
        // Get top singles by person
        const prSingles = await this.resultModel
          .aggregate([
            { $match },
            { $unwind: '$personIds' },
            { $group: { _id: { personId: '$personIds' }, best: { $min: '$best' } } },
            { $sort: { best: 1 } },
          ])
          .exec();

        for (const pr of prSingles) {
          const result = await this.resultModel.findOne({ personIds: pr._id.personId, best: pr.best }, excl).exec();
          this.setRankedPersonAsFirst(pr._id.personId, result.personIds);
          eventResults.push(result);
        }
      }

      const rankedResults = await setRankings(eventResults, { dontSortOrSave: true });

      for (const result of rankedResults) {
        const ranking: IRanking = {
          ranking: result.ranking,
          persons: await this.personsService.getPersonsByPersonIds(result.personIds, { preserveOrder: true }),
          resultId: result._id.toString(),
          result: show ? (result.attempts as any).result : result.best,
          // Will be left undefined if the request wasn't for top single results
          attemptNumber: (result as any).attemptNumber,
          date: result.date,
          videoLink: result.videoLink,
          discussionLink: result.discussionLink,
        };

        // Set memo, if the result has it
        if (show === 'results') {
          ranking.memo = (result.attempts as any).memo; // will be left undefined if there is no memo
        } else {
          const tiedBestAttempts = result.attempts.filter((el) => el.result === result.best);
          if (tiedBestAttempts.length === 1) ranking.memo = tiedBestAttempts[0].memo;
        }

        if (result.competitionId) {
          ranking.contest = await this.contestModel.findOne({ competitionId: result.competitionId }, excl).exec();
        }

        eventRankings.rankings.push(ranking);
      }
    } else {
      const $match = { ...getBaseAvgsFilter(event), unapproved: { $exists: false } };

      if (show === 'results') {
        // Get all top average results
        eventResults = await this.resultModel.find($match).sort({ average: 1 }).exec();
      } else {
        // Get top averages by person

        const prAverages = await this.resultModel
          .aggregate([
            { $match },
            { $unwind: '$personIds' },
            { $group: { _id: { personId: '$personIds' }, average: { $min: '$average' } } },
            { $sort: { average: 1 } },
          ])
          .exec();

        for (const pr of prAverages) {
          const result = await this.resultModel.findOne({ personIds: pr._id.personId, average: pr.average }).exec();
          this.setRankedPersonAsFirst(pr._id.personId, result.personIds);
          eventResults.push(result);
        }
      }

      const rankedResults = await setRankings(eventResults, {
        ranksWithAverage: true,
        dontSortOrSave: true,
        noTieBreakerForAvgs: true,
      });

      for (const result of rankedResults) {
        const ranking: IRanking = {
          ranking: result.ranking,
          persons: await this.personsService.getPersonsByPersonIds(result.personIds, { preserveOrder: true }),
          resultId: result._id.toString(),
          result: result.average,
          attempts: result.attempts,
          date: result.date,
          videoLink: result.videoLink,
          discussionLink: result.discussionLink,
        };

        if (result.competitionId) {
          ranking.contest = await this.contestModel.findOne({ competitionId: result.competitionId }, excl).exec();
        }

        eventRankings.rankings.push(ranking);
      }
    }

    return eventRankings;
  }

  // Gets the current records for the requested record type for all events.
  // Includes person objects for each record, and includes all ties.
  async getRecords(wcaEquivalent: string): Promise<IEventRankings[]> {
    // Make sure the requested record type is valid
    if (
      !Object.values(WcaRecordType)
        .map((el) => el.toString())
        .includes(wcaEquivalent)
    ) {
      throw new BadRequestException(`Record type ${wcaEquivalent} does not exist`);
    }

    const activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });
    if (!activeRecordTypes.some((el) => el.wcaEquivalent === wcaEquivalent))
      throw new BadRequestException(`The record type ${wcaEquivalent} is inactive`);

    const recordsByEvent: IEventRankings[] = [];
    const events = await this.eventsService.getEvents({ excludeRemovedAndHidden: true });

    for (const rt of activeRecordTypes) {
      for (const event of events) {
        const eventRecords: IEventRankings = { event, rankings: [] };

        const [singleResults, averageResults] = await this.getEventRecordResults(event.eventId, rt.wcaEquivalent);

        for (const result of singleResults) {
          eventRecords.rankings.push({
            type: 'single',
            persons: await this.personsService.getPersonsByPersonIds(result.personIds, { preserveOrder: true }),
            resultId: result._id.toString(),
            result: result.best,
            date: result.date,
            contest: result.competitionId
              ? await this.contestModel.findOne({ competitionId: result.competitionId }, excl).exec()
              : undefined,
            videoLink: result.videoLink,
            discussionLink: result.discussionLink,
          });
        }

        for (const result of averageResults) {
          eventRecords.rankings.push({
            type: result.attempts.length === 3 ? 'mean' : 'average',
            persons: await this.personsService.getPersonsByPersonIds(result.personIds, { preserveOrder: true }),
            resultId: result._id.toString(),
            result: result.average,
            date: result.date,
            contest: result.competitionId
              ? await this.contestModel.findOne({ competitionId: result.competitionId }, excl).exec()
              : undefined,
            attempts: result.attempts,
            videoLink: result.videoLink,
            discussionLink: result.discussionLink,
          });
        }

        if (eventRecords.rankings.length > 0) {
          recordsByEvent.push(eventRecords);
        }
      }
    }

    return recordsByEvent;
  }

  async getSubmissionInfo(recordsUpTo: Date): Promise<IResultsSubmissionInfo> {
    const submissionBasedEvents = await this.eventsService.getSubmissionBasedEvents();
    const activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });

    const resultsSubmissionInfo: IResultsSubmissionInfo = {
      events: submissionBasedEvents,
      recordPairsByEvent: await this.getRecordPairs(submissionBasedEvents, recordsUpTo, { activeRecordTypes }),
      activeRecordTypes,
    };

    return resultsSubmissionInfo;
  }

  async getEditingInfo(resultId: string): Promise<IResultsSubmissionInfo> {
    const result = await this.resultModel.findOne({ _id: resultId }, exclSysButKeepCreatedBy).exec();
    if (!result) throw new NotFoundException('Result not found');

    const event = await this.eventsService.getEventById(result.eventId);
    const activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });

    const resultEditingInfo: IResultsSubmissionInfo = {
      events: [event],
      recordPairsByEvent: await this.getRecordPairs([event], result.date, {
        activeRecordTypes,
        excludeResultId: resultId,
      }),
      activeRecordTypes,
      result,
      persons: await this.personsService.getPersonsByPersonIds(result.personIds, { preserveOrder: true }),
      creator: await this.usersService.getUserDetails(result.createdBy.toString(), false),
    };

    return resultEditingInfo;
  }

  async getTotalResults(queryFilter: any = {}): Promise<number> {
    return await this.resultModel.countDocuments(queryFilter).exec();
  }

  async getSubmissionBasedResults(): Promise<IFeResult[]> {
    try {
      let frontendResults: IFeResult[] = await this.resultModel
        .aggregate([
          { $match: { competitionId: { $exists: false } } },
          { $lookup: { from: 'people', localField: 'personIds', foreignField: 'personId', as: 'persons' } },
          { $lookup: { from: 'events', localField: 'eventId', foreignField: 'eventId', as: 'event' } },
          { $set: { event: { $arrayElemAt: ['$event', 0] } } }, // $lookup makes the event field an array, so this undoes that
          { $sort: { createdAt: -1 } },
          { $project: excl },
        ])
        .exec();

      // Fixes the lookup stage breaking the order of the competitors
      frontendResults = frontendResults.map((res) => ({
        ...res,
        persons: res.personIds.map((pid) => res.persons.find((p) => p.personId === pid)),
      }));

      return frontendResults;
    } catch (err) {
      throw new InternalServerErrorException(`Error while getting submission-based results: ${err.message}`);
    }
  }

  // The user can be left undefined when this is called by app.service.ts, which has its own authorization check
  async createResult(
    createResultDto: CreateResultDto,
    roundId: string,
    { user }: { user?: IPartialUser } = {},
  ): Promise<RoundDocument> {
    const contest = await this.getContestAndCheckAccessRights(createResultDto.competitionId, { user });

    const round = await this.roundModel
      .findOne({ competitionId: createResultDto.competitionId, roundId })
      .populate(resultPopulateOptions)
      .exec();
    if (!round) throw new BadRequestException('Round not found');
    const event = await this.eventsService.getEventById(createResultDto.eventId);

    await this.validateAndCleanUpResult(createResultDto, event, { mode: 'create', round });

    // Set result date. For contests with a schedule, the schedule must be used to set the date.
    if (!getIsCompType(contest.type)) {
      createResultDto.date = contest.startDate;
    } else {
      const schedule = await this.scheduleModel.findOne({ competitionId: createResultDto.competitionId }).exec();

      if (!schedule) {
        throw new InternalServerErrorException(
          `No schedule found for contest with ID ${createResultDto.competitionId}`,
        );
      }

      let activity: IActivity;

      scheduleLoop: {
        for (const venue of schedule.venues) {
          for (const room of venue.rooms) {
            for (const act of room.activities) {
              if (act.activityCode === round.roundId) {
                activity = act;
                createResultDto.date = getDateOnly(toZonedTime(activity.endTime, venue.timezone));
                break scheduleLoop;
              }
            }
          }
        }
      }

      if (!activity) throw new InternalServerErrorException(`No schedule activity found for round ${round.roundId}`);
    }

    // Create new result and update the round's results
    const recordPairs = await this.getEventRecordPairs(event, { recordsUpTo: createResultDto.date });
    const newResult = await this.resultModel.create({
      ...setResultRecords(createResultDto, event, recordPairs),
      // Admins are allowed to edit finished contests, so this check is necessary. If it's a finished contest
      // and the user is not an admin, they won't have access rights anyways, so the roles don't need to be checked here.
      unapproved: contest.state < ContestState.Finished ? true : undefined,
    });

    if (!newResult.unapproved) await this.personsService.approvePersons({ personIds: newResult.personIds });

    await this.updateFutureRecords(newResult, event, recordPairs, { mode: 'create' });

    round.results.push(newResult);
    round.results = await setRankings(round.results, { ranksWithAverage: getRoundRanksWithAverage(round.format) });
    await round.save();
    await this.updateContestParticipants(contest);

    const updatedRound = await this.roundModel
      .findOne({ competitionId: createResultDto.competitionId, roundId }, excl)
      .populate(resultPopulateOptions)
      .exec();

    return updatedRound;
  }

  async submitResult(submitResultDto: SubmitResultDto, user: IPartialUser) {
    const isAdmin = user.roles.includes(Role.Admin);

    // Disallow admin-only features
    if (!isAdmin) {
      if (submitResultDto.videoLink === '') throw new UnauthorizedException('Please enter a video link');
      if (submitResultDto.attempts.some((a) => a.result === C.maxTime))
        throw new UnauthorizedException('You are not authorized to set unknown time');
    }

    if (!isAdmin) submitResultDto.unapproved = true;
    submitResultDto.date = new Date(submitResultDto.date);

    const event = await this.eventsService.getEventById(submitResultDto.eventId);

    await this.validateAndCleanUpResult(submitResultDto, event, { mode: 'submit' });

    const recordPairs = await this.getEventRecordPairs(event, { recordsUpTo: submitResultDto.date });
    const newResult = { ...submitResultDto, createdBy: new mongo.ObjectId(user._id as string) };
    const createdResult = await this.resultModel.create(setResultRecords(newResult, event, recordPairs, !isAdmin));

    if (isAdmin) {
      await this.personsService.approvePersons({ personIds: createdResult.personIds });

      await this.updateFutureRecords(createdResult, event, recordPairs, { mode: 'create' });
    } else {
      let text = `A new ${createdResult.eventId} result has been submitted by user ${user.username}: ${getFormattedTime(
        createdResult.best,
        { event, showMultiPoints: true, showDecimals: true },
      )}`;
      if (createdResult.regionalSingleRecord) text += ` (${createdResult.regionalSingleRecord})`;
      if (createdResult.average > 0) {
        text += `, average: ${getFormattedTime(createdResult.average)}`;
        if (createdResult.regionalAverageRecord) text += ` (${createdResult.regionalAverageRecord})`;
      }
      text += `. Video link: ${newResult.videoLink}`;

      await this.emailService.sendEmail(C.contactEmail, text, { subject: 'New Result Submission' });
    }

    return createdResult;
  }

  // The user can be left undefined when this is called from enterAttemptFromExternalDevice() or when editing a submitted result
  async updateResult(resultId: string, updateResultDto: UpdateResultDto, { user }: { user?: IPartialUser } = {}) {
    const result = await this.resultModel.findOne({ _id: resultId }).exec();
    if (!result) throw new NotFoundException(`Result with ID ${resultId} not found`);
    const event = await this.eventsService.getEventById(result.eventId);

    let contest: ContestDocument, round: RoundDocument;
    if (result.competitionId) {
      contest = await this.getContestAndCheckAccessRights(result.competitionId, { user });
      round = await this.roundModel
        .findOne({ results: new mongo.ObjectId(resultId) })
        .populate(resultPopulateOptions)
        .exec();
      if (!round) throw new BadRequestException('Round not found');
    }

    const previousBest = result.best;
    const previousAvg = result.average;

    if (!result.competitionId) {
      if (updateResultDto.date && result.unapproved) result.date = new Date(updateResultDto.date);
      result.videoLink = updateResultDto.videoLink;
      result.discussionLink = updateResultDto.discussionLink;
    }

    result.personIds = updateResultDto.personIds;
    result.attempts = updateResultDto.attempts; // the best and average get updated in validateAndCleanUpResult
    // The best and average are set in validateAndCleanUpResult
    result.best = null;
    result.average = null;
    result.regionalSingleRecord = undefined;
    result.regionalAverageRecord = undefined;

    await this.validateAndCleanUpResult(result, event, { mode: 'edit', round });

    const recordPairs = await this.getEventRecordPairs(event, {
      recordsUpTo: result.date,
      excludeResultId: result._id.toString(),
    });
    setResultRecords(result, event, recordPairs);

    // This is only relevant for video-based results
    if (result.unapproved && !updateResultDto.unapproved) {
      result.unapproved = undefined;
      await result.save();

      await this.updateFutureRecords(result, event, recordPairs, { mode: 'create' });
      await this.personsService.approvePersons({ personIds: result.personIds });

      await this.emailService.sendEmail(
        await this.usersService.getUserEmail({ _id: result.createdBy }),
        `Your ${event.name} result has been approved. You can see it in the rankings <a href="${process.env.BASE_URL}/rankings/${event.eventId}/single">here</a>.`,
        { subject: 'Result Approved' },
      );
    } else {
      await result.save();
      await this.updateFutureRecords(result, event, recordPairs, { mode: 'edit', previousBest, previousAvg });
    }

    // Update round rankings, if it's a contest result
    if (contest) {
      round.results = round.results.map((r) => (r._id.toString() === resultId ? result : r));
      round.results = await setRankings(round.results, { ranksWithAverage: getRoundRanksWithAverage(round.format) });
      round.save();
      await this.updateContestParticipants(contest);

      const updatedRound = await this.roundModel
        .findOne({ competitionId: result.competitionId, roundId: round.roundId }, excl)
        .populate(resultPopulateOptions)
        .exec();
      return updatedRound;
    }
    return undefined;
  }

  async deleteResult(resultId: string, user: IPartialUser): Promise<RoundDocument> {
    const result = await this.resultModel.findOne({ _id: resultId }).exec();
    if (!result) throw new BadRequestException(`Result with ID ${resultId} not found`);
    const event = await this.eventsService.getEventById(result.eventId);

    let contest: ContestDocument, round: RoundDocument;
    if (result.competitionId) {
      contest = await this.getContestAndCheckAccessRights(result.competitionId, { user });
      round = await this.roundModel
        .findOne({ results: new mongo.ObjectId(resultId) })
        .populate(resultPopulateOptions)
        .exec();
      if (!round) throw new BadRequestException('Round not found');
    }

    await this.resultModel.deleteOne({ _id: resultId }).exec();
    const recordPairs = await this.getEventRecordPairs(event, { recordsUpTo: result.date, excludeResultId: resultId });
    await this.updateFutureRecords(result, event, recordPairs, { mode: 'delete' });

    if (contest) {
      round.results = round.results.filter((el) => el._id.toString() !== resultId);
      round.results = await setRankings(round.results, { ranksWithAverage: getRoundRanksWithAverage(round.format) });
      round.save();
      await this.updateContestParticipants(contest);

      const updatedRound = await this.roundModel
        .findOne({ competitionId: result.competitionId, roundId: round.roundId }, excl)
        .populate(resultPopulateOptions)
        .exec();
      return updatedRound;
    }
    return undefined;
  }

  /////////////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////////////

  // Gets record pairs for multiple events
  async getRecordPairs(
    events: IEvent[],
    recordsUpTo: Date,
    { activeRecordTypes, excludeResultId }: { activeRecordTypes?: IRecordType[]; excludeResultId?: string } = {},
  ): Promise<IEventRecordPairs[]> {
    if (!activeRecordTypes) activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });
    const recordPairsByEvent: IEventRecordPairs[] = [];

    // Get current records for this contest's events
    for (const event of events) {
      recordPairsByEvent.push({
        eventId: event.eventId,
        recordPairs: await this.getEventRecordPairs(event, { recordsUpTo, activeRecordTypes, excludeResultId }),
      });
    }

    return recordPairsByEvent;
  }

  async getEventRecordPairs(
    event: IEvent,
    {
      recordsUpTo = new Date(8640000000000000),
      activeRecordTypes,
      excludeResultId,
    }: {
      recordsUpTo?: Date; // this shouldn't include time (so the time should be midnight)
      activeRecordTypes?: IRecordType[];
      excludeResultId?: string;
    } = {},
  ): Promise<IRecordPair[]> {
    if (!activeRecordTypes) activeRecordTypes = await this.recordTypesService.getRecordTypes({ active: true });

    const recordPairs: IRecordPair[] = [];

    // Go through all active record types
    for (const rt of activeRecordTypes) {
      try {
        const recordPair: IRecordPair = { wcaEquivalent: rt.wcaEquivalent, best: -1, average: -1 };
        const queryBase: any = { date: { $lte: recordsUpTo } };
        if (excludeResultId) queryBase._id = { $ne: excludeResultId };

        const [singleRecordResult] = await this.resultModel
          .find({ ...queryBase, ...getBaseSinglesFilter(event) })
          .sort({ best: 1 })
          .limit(1)
          .exec();

        if (singleRecordResult) recordPair.best = singleRecordResult.best;

        const [avgRecordResult] = await this.resultModel
          .find({ ...queryBase, ...getBaseAvgsFilter(event) })
          .sort({ average: 1 })
          .limit(1)
          .exec();

        if (avgRecordResult) recordPair.average = avgRecordResult.average;

        recordPairs.push(recordPair);
      } catch (err) {
        throw new InternalServerErrorException(`Error while getting ${rt.wcaEquivalent} record pair`);
      }
    }

    return recordPairs;
  }

  // Returns array of single record results (all ties) and array of average record results (all ties)
  private async getEventRecordResults(
    eventId: string,
    wcaEquivalent: WcaRecordType,
  ): Promise<[ResultDocument[], ResultDocument[]]> {
    const output: [ResultDocument[], ResultDocument[]] = [[], []];
    const queryFilter: any = {
      eventId,
      regionalSingleRecord: wcaEquivalent,
      unapproved: { $exists: false },
    };

    // Get fastest single record result
    const [singleRecordResult] = await this.resultModel.find(queryFilter, excl).sort({ best: 1 }).limit(1).exec();

    // If found, get all tied record results, with the oldest at the top
    if (singleRecordResult) {
      queryFilter.best = singleRecordResult.best;
      output[0] = await this.resultModel.find(queryFilter, excl).sort({ date: 1 }).exec();
    }

    delete queryFilter.regionalSingleRecord;
    delete queryFilter.best;
    queryFilter.regionalAverageRecord = wcaEquivalent;

    // Get fastest average record result
    const [avgRecordResult] = await this.resultModel.find(queryFilter, excl).sort({ average: 1 }).limit(1).exec();

    // If found, get all tied record results, with the oldest at the top
    if (avgRecordResult) {
      queryFilter.average = avgRecordResult.average;
      output[1] = await this.resultModel.find(queryFilter, excl).sort({ date: 1 }).exec();
    }

    return output;
  }

  // Updates records set on the same day or in the future
  async updateFutureRecords(
    result: CreateResultDto | ResultDocument,
    event: EventDocument,
    recordPairs: IRecordPair[],
    {
      mode,
      previousBest,
      previousAvg,
    }: {
      mode: 'create' | 'edit' | 'delete';
      previousBest?: number; // only used for result edit
      previousAvg?: number; // only used for result edit
    },
  ) {
    if (mode === 'edit' && (previousBest === undefined || previousAvg === undefined))
      throw new InternalServerErrorException('Previous single and average are not defined');

    // TO-DO: IT IS POSSIBLE THAT THERE WAS STILL A RECORD, JUST OF A DIFFERENT TYPE
    for (const rp of recordPairs) {
      try {
        const singlesComparison = mode === 'edit' ? compareSingles(result, { best: previousBest } as IResult) : 0;
        const singleGotWorse = singlesComparison > 0 || (mode === 'delete' && result.best > 0);
        const singleGotBetter = singlesComparison < 0 || (mode === 'create' && result.best > 0);

        if (singleGotWorse || singleGotBetter) {
          const singleQuery = {
            ...getBaseSinglesFilter(event),
            _id: { $ne: (result as any)._id },
            date: { $gte: result.date },
          };

          if (singleGotWorse) {
            const best: any = { $gt: 0 };

            // Make sure it's better than the record at the time, if there was one, and better than the new best, if it's an edit
            if (rp.best > 0) best.$lte = rp.best;
            if (mode === 'edit' && compareSingles(result, { best: rp.best } as IResult) < 0) best.$lte = result.best;
            singleQuery.best = best;

            await this.recordTypesService.setEventSingleRecords(event, rp.wcaEquivalent, singleQuery);
          } else {
            // Remove single records cancelled by the new result or by the improved edited result
            await this.resultModel
              .updateMany({ ...singleQuery, best: { $gt: result.best } }, { $unset: { regionalSingleRecord: '' } })
              .exec();
          }
        }

        const avgsComparison = mode === 'edit' ? compareAvgs(result, { average: previousAvg } as IResult, true) : 0;
        const avgGotWorse = avgsComparison > 0 || (mode === 'delete' && result.average > 0);
        const avgGotBetter = avgsComparison < 0 || (mode === 'create' && result.average > 0);

        if (avgGotWorse || avgGotBetter) {
          const avgQuery = {
            ...getBaseAvgsFilter(event),
            _id: { $ne: (result as any)._id },
            date: { $gte: result.date },
          };

          if (avgGotWorse) {
            const average: any = { $gt: 0 };

            // Make sure it's better than the record at the time, if there was one, and better than the new average, if it's an edit
            if (rp.average > 0) average.$lte = rp.average;
            if (mode === 'edit' && compareAvgs(result, { average: rp.average } as IResult, true) < 0)
              average.$lte = result.average;
            avgQuery.average = average;

            await this.recordTypesService.setEventAvgRecords(event, rp.wcaEquivalent, avgQuery);
          } else {
            // Remove average records cancelled by the new result or by the improved edited result
            await this.resultModel
              .updateMany({ ...avgQuery, average: { $gt: result.average } }, { $unset: { regionalAverageRecord: '' } })
              .exec();
          }
        }
      } catch (err) {
        throw new InternalServerErrorException(
          `Error while updating ${rp.wcaEquivalent} records after result update: ${err.message}`,
        );
      }
    }
  }

  private async getContestAndCheckAccessRights(
    competitionId: string,
    { user }: { user?: IPartialUser },
  ): Promise<ContestDocument> {
    const contest = await this.contestModel
      .findOne({ competitionId })
      .populate(orgPopulateOptions) // needed for access rights checking
      .exec();

    if (!contest) throw new BadRequestException(`Competition with ID ${competitionId} not found`);
    if (user) this.authService.checkAccessRightsToContest(user, contest);

    return contest;
  }

  private async updateContestParticipants(contest: ContestDocument) {
    if (contest.state < ContestState.Ongoing) contest.state = ContestState.Ongoing;
    contest.participants = (
      await this.personsService.getContestParticipants({ competitionId: contest.competitionId })
    ).length;
    await contest.save();
  }

  // Sets the person being ranked as the first person in the list, if it's a team event
  private setRankedPersonAsFirst(personId: number, personIds: number[]) {
    if (personIds.length > 1) {
      // Sort the person IDs in the result, so that the person, whose PR this result is, is first
      personIds.sort((a) => (a === personId ? -1 : 0));
    }
  }

  async validateAndCleanUpResult(
    result: IResult,
    event: IEvent,
    {
      round,
      mode,
    }: {
      round?: IRound; // if round is defined, that means it's a contest result, not a submitted one
      mode: 'create' | 'submit' | 'edit';
    },
  ) {
    if (result.personIds.length !== (event.participants ?? 1)) {
      throw new BadRequestException(
        `This event must have ${event.participants ?? 1} participant${event.participants ? 's' : ''}`,
      );
    }
    if (result.personIds.some((p1, i1) => result.personIds.some((p2, i2) => i1 !== i2 && p1 === p2)))
      throw new BadRequestException('You cannot enter the same person twice in the same result');

    // This wouldn't be affected by empty attempts, because video-based results don't allow empty attempts,
    // and this is only used for those results, because a competition result would have a round
    const format = round
      ? roundFormats.find((rf) => rf.value === round.format)
      : roundFormats.find((rf) => rf.attempts === result.attempts.length && rf.value !== RoundFormat.BestOf3);

    // Validate the best single and the average
    const { best, average } = getBestAndAverage(result.attempts, event, { round, roundFormat: format.value });
    if (result.best === null) result.best = best;
    else if (result.best !== best) throw new BadRequestException('The best single is incorrect. Please try again.');
    if (result.average === null) result.average = average;
    else if (result.average !== average) throw new BadRequestException('The average is incorrect. Please try again.');

    if (round) {
      // Make sure there is no result for any of the same people
      const resultFromSamePerson = round.results.find(
        (r) =>
          (mode !== 'edit' || (r as any)._id.toString() !== (result as any)._id.toString()) &&
          r.personIds.some((p) => result.personIds.includes(p)),
      );
      if (resultFromSamePerson) {
        throw new BadRequestException(
          result.personIds.length === 1
            ? 'That competitor already has a result in this round'
            : 'One of the competitors already has a result in this round',
        );
      }

      // Time limit validation
      if (round.timeLimit) {
        if (result.attempts.some((a) => a.result > round.timeLimit.centiseconds))
          throw new BadRequestException(
            `This round has a time limit of ${getFormattedTime(round.timeLimit.centiseconds)}`,
          );

        if (round.timeLimit.cumulativeRoundIds.length > 0) {
          let total = 0;

          // Add the attempt times from the new result
          for (const attempt of result.attempts) total += attempt.result;

          // Add all attempt times from the other rounds included in the cumulative time limit
          const rounds = await this.roundModel
            .find({
              competitionId: result.competitionId,
              roundId: { $in: round.timeLimit.cumulativeRoundIds, $ne: round.roundId },
            })
            .populate(resultPopulateOptions)
            .exec();

          for (const r of rounds) {
            const samePeoplesResult: IResult = r.results.find(
              (res) => !res.personIds.some((pid) => !result.personIds.includes(pid)),
            );

            if (samePeoplesResult) {
              for (const attempt of samePeoplesResult.attempts) total += attempt.result;
            }
          }

          if (total >= round.timeLimit.centiseconds) {
            throw new BadRequestException(
              `This round has a cumulative time limit of ${getFormattedTime(round.timeLimit.centiseconds)}${
                round.timeLimit.cumulativeRoundIds.length === 1
                  ? ''
                  : ` for these rounds: ${round.timeLimit.cumulativeRoundIds.join(', ')}`
              }`,
            );
          }
        }

        // Cutoff validation
        if (round.cutoff) {
          const passes = getMakesCutoff(result.attempts, round.cutoff);

          if (passes) {
            if (result.attempts.length !== format.attempts)
              throw new BadRequestException(
                `The number of attempts should be ${format.attempts}; received: ${result.attempts.length}`,
              );
          } else if (result.attempts.length > round.cutoff.numberOfAttempts) {
            if (result.attempts.slice(round.cutoff.numberOfAttempts).some((a) => a.result !== 0)) {
              throw new BadRequestException(
                `This round has a cutoff of ${getFormattedTime(round.cutoff.attemptResult)}`,
              );
            } else {
              result.attempts = result.attempts.slice(0, round.cutoff.numberOfAttempts);
            }
          } else if (result.attempts.length < round.cutoff.numberOfAttempts) {
            throw new BadRequestException(
              `The number of attempts should be ${round.cutoff.numberOfAttempts}; received: ${result.attempts.length}`,
            );
          }
        }
      }
    }
    // Video-based results validation
    else {
      if (result.videoLink === undefined) throw new BadRequestException('Please enter a video link');
    }
  }
}
