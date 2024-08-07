import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { toZonedTime } from 'date-fns-tz';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { ResultDocument } from '~/src/models/result.model';
import { ContestDocument } from '~/src/models/contest.model';
import { RoundDocument } from '~/src/models/round.model';
import { PersonDocument } from '~/src/models/person.model';
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
import { eventPopulateOptions, excl, exclSysButKeepCreatedBy, orgPopulateOptions } from '~/src/helpers/dbHelpers';
import C from '@sh/constants';
import { ContestState, Role, WcaRecordType } from '@sh/enums';
import {
  IEventRankings,
  IRecordType,
  IRecordPair,
  IEventRecordPairs,
  IResultsSubmissionInfo,
  IContest,
  IRanking,
  IEvent,
  IFeResult,
  IActivity,
  IResult,
  IContestEvent,
  IRound,
} from '@sh/types';
import { IPartialUser } from '~/src/helpers/interfaces/User';
import {
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
        const rounds = await this.roundModel.find({ results: res }).exec();

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
              ...getBaseSinglesFilter(event, { best: { $lt: result.best, $gt: 0 } }),
              date: { $lte: result.date },
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
              ...getBaseAvgsFilter(event, { average: { $lt: result.average, $gt: 0 } }),
              date: { $lte: result.date },
            })
            .exec();
          if (betterAvgsInThePast.length > 0) {
            this.logger.error(
              `${result.eventId} average WR ${result} is worse than these results: ${betterAvgsInThePast}`,
            );
          }
        }
      }

      // Look for orphan rounds or ones that belong to multiple contests or ones that have an invalid date
      const rounds = await this.roundModel.find().exec();
      for (const round of rounds) {
        const contests = await this.contestModel.find({ 'events.rounds': round }).exec();

        if (contests.length === 0) this.logger.error(`Error: round has no contest: ${round}`);
        else if (contests.length > 1)
          this.logger.error(`Error: round ${round} belongs to multiple contests: ${contests}`);
      }

      // Look for duplicate video links (ignoring the ones that are intentionally repeated in the production DB)
      let knownDuplicates = [
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
        this.logger.log(
          `These video links have multiple results: ${repeatedVideoLinks
            .map((x) => `${x._id} (${x.count})`)
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

      this.logger.log('All results inconsistencies checked!');
    }
  }

  async getRankings(eventId: string, forAverage = false, show?: 'results'): Promise<IEventRankings> {
    const event = await this.eventsService.getEventById(eventId);

    if (!event) throw new BadRequestException(`Event with ID ${eventId} not found`);

    const eventRankings: IEventRankings = {
      event,
      rankings: [],
    };
    let eventResults: ResultDocument[] = [];

    if (!forAverage) {
      if (show === 'results') {
        // Get all top single results

        eventResults = await this.resultModel
          .aggregate([
            { $match: getBaseSinglesFilter(event) },
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
            { $match: getBaseSinglesFilter(event) },
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
          persons: [],
          resultId: result._id.toString(),
          result: show ? (result.attempts as any).result : result.best,
          // Will be left undefined if the request wasn't for top single results
          attemptNumber: (result as any).attemptNumber,
          date: result.date,
          videoLink: result.videoLink,
          discussionLink: result.discussionLink,
        };
        const persons: PersonDocument[] = await this.personsService.getPersonsById(result.personIds, {
          preserveOrder: true,
        });

        // This is done so that the persons array stays in the same order
        for (const personId of result.personIds) ranking.persons.push(persons.find((el) => el.personId === personId));

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
      if (show === 'results') {
        // Get all top average results
        eventResults = await this.resultModel.find(getBaseAvgsFilter(event)).sort({ average: 1 }).exec();
      } else {
        // Get top averages by person

        const prAverages = await this.resultModel
          .aggregate([
            { $match: getBaseAvgsFilter(event) },
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
          persons: [],
          resultId: result._id.toString(),
          result: result.average,
          attempts: result.attempts,
          date: result.date,
          videoLink: result.videoLink,
          discussionLink: result.discussionLink,
        };
        const persons: PersonDocument[] = await this.personsService.getPersonsById(result.personIds, {
          preserveOrder: true,
        });

        // This is done so that the persons array stays in the same order
        for (const personId of result.personIds) ranking.persons.push(persons.find((el) => el.personId === personId));

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

    if (!activeRecordTypes.some((el) => el.wcaEquivalent === wcaEquivalent)) {
      throw new BadRequestException(`The record type ${wcaEquivalent} is inactive`);
    }

    const recordsByEvent: IEventRankings[] = [];
    const events = await this.eventsService.getEvents({ excludeRemovedAndHidden: true });

    for (const rt of activeRecordTypes) {
      for (const event of events) {
        const eventRecords: IEventRankings = { event, rankings: [] };

        const [singleResults, averageResults] = await this.getEventRecordResults(event.eventId, rt.wcaEquivalent);

        for (const result of singleResults) {
          eventRecords.rankings.push({
            type: 'single',
            persons: await this.personsService.getPersonsById(result.personIds, { preserveOrder: true }),
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
            persons: await this.personsService.getPersonsById(result.personIds, { preserveOrder: true }),
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
    let result: ResultDocument;

    try {
      result = await this.resultModel.findOne({ _id: resultId }, exclSysButKeepCreatedBy).exec();
      if (!result) throw new Error();
    } catch {
      throw new NotFoundException('Result not found');
    }

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
      persons: await this.personsService.getPersonsById(result.personIds, { preserveOrder: true }),
      creator: await this.usersService.getUserDetails(result.createdBy.toString(), false),
    };

    return resultEditingInfo;
  }

  async getTotalResults(queryFilter: any = {}): Promise<number> {
    try {
      return await this.resultModel.countDocuments(queryFilter).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
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

      return frontendResults.slice(0, 100); // TEMPORARY: only returns 100 results. TO-DO: add pagination!
    } catch (err) {
      throw new InternalServerErrorException(`Error while getting submission-based results: ${err.message}`);
    }
  }

  // Used by external APIs, so access rights aren't checked here, they're checked in app.service.ts with an API key
  async getContestResultAndEvent(
    competitionId: string,
    eventId: string,
    roundNumber: number,
    personId: number,
  ): Promise<{ result: ResultDocument; contestEvent: IContestEvent }> {
    const contest = await this.contestModel
      .findOne({ competitionId })
      .populate(eventPopulateOptions.event)
      .populate(eventPopulateOptions.rounds)
      .exec();

    if (!contest) throw new NotFoundException(`Competition with ID ${competitionId} not found`);
    if (contest.state > ContestState.Ongoing) throw new BadRequestException('The contest is finished');

    const contestEvent = contest.events.find((e) => e.event.eventId === eventId);

    if (!contestEvent) throw new NotFoundException(`Event with ID ${eventId} not found for the given competition`);
    if (contestEvent.rounds.length < roundNumber)
      throw new BadRequestException(`The specified competition event only has ${contestEvent.rounds.length} rounds`);

    const round = contestEvent.rounds[roundNumber - 1];

    if (!round) throw new BadRequestException(`Round number ${roundNumber} not found`);

    const result = round.results.find((r) => r.personIds.length === 1 && r.personIds[0] === personId);

    return { result, contestEvent };
  }

  // The user can be left undefined when this is called by app.service.ts, which has its own authorization check
  async createResult(
    createResultDto: CreateResultDto,
    roundId: string,
    { user, skipValidation = false }: { user?: IPartialUser; skipValidation?: boolean },
  ): Promise<RoundDocument> {
    // getContest is put here deliberately, because this function also checks access rights!
    const contest = await this.getContest(createResultDto.competitionId, user);
    const event = await this.eventsService.getEventById(createResultDto.eventId);
    const recordPairs = await this.getEventRecordPairs(event, { recordsUpTo: createResultDto.date });
    const round = await this.roundModel
      .findOne({ competitionId: createResultDto.competitionId, roundId })
      .populate('results')
      .exec();

    if (!skipValidation) {
      await this.validateAndCleanUpResult(createResultDto, event, { round });
    }

    // Admins are allowed to edit finished contests too, so this check is necessary.
    // If it's a finished contest and the user is not an admin, they won't have access rights
    // anyways (since getContest() is used above), so the roles don't need to be checked here.
    if (contest.state < ContestState.Finished) createResultDto.unapproved = true;

    // Set result date. For contests with a schedule, the schedule must be used to set the date.
    if (!getIsCompType(contest.type)) {
      createResultDto.date = contest.startDate;
    } else {
      const schedule = await this.scheduleModel.findOne({ competitionId: createResultDto.competitionId }).exec();

      if (!schedule)
        throw new InternalServerErrorException(
          `No schedule found for contest with ID ${createResultDto.competitionId}`,
        );

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

      if (!activity)
        throw new InternalServerErrorException(`No schedule activity found for round with ID ${round.roundId}`);
    }

    const oldResults = [...round.results];
    let newResult: ResultDocument;

    try {
      // Create new result and update the round's results
      newResult = await this.resultModel.create(setResultRecords(createResultDto, event, recordPairs));

      round.results.push(newResult);
      round.results = await setRankings(round.results, { ranksWithAverage: getRoundRanksWithAverage(round.format) });
      await round.save(); // save the round for resetCancelledRecords

      await this.resetCancelledRecords(createResultDto, event, contest.state);

      if (contest.state < ContestState.Ongoing) contest.state = ContestState.Ongoing;
      contest.participants = (
        await this.personsService.getContestParticipants({ competitionId: contest.competitionId })
      ).length;
      await contest.save();

      const updatedRound = await this.roundModel
        .findOne({ competitionId: createResultDto.competitionId, roundId }, excl)
        .populate('results')
        .exec();

      return updatedRound;
    } catch (err) {
      if (newResult) await newResult.deleteOne();
      if (oldResults) {
        round.results = oldResults;
        await round.save();
      }
      await this.updateRecordsAfterDeletion(createResultDto, contest, event);

      throw new InternalServerErrorException(`Error while creating result: ${err.message}`);
    }
  }

  // The user can be left undefined when this is called by app.service.ts, which has its own authorization check
  async deleteContestResult(resultId: string, competitionId: string, user?: IPartialUser): Promise<RoundDocument> {
    // getContest is put here deliberately, because this function also checks access rights!
    const contest = await this.getContest(competitionId, user);
    let result: ResultDocument;

    // Find result first
    try {
      result = await this.resultModel.findOne({ _id: resultId }).exec();
    } catch (err) {
      throw new InternalServerErrorException(`Error while deleting result: ${err.message}`);
    }

    if (!result) throw new BadRequestException(`Result with ID ${resultId} not found`);
    if (result.competitionId !== competitionId)
      throw new BadRequestException("The result's competition ID doesn't match the URL parameter");

    // Update round
    let round: RoundDocument;
    let oldResults: ResultDocument[];
    const event = await this.eventsService.getEventById(result.eventId);

    try {
      round = await this.roundModel.findOne({ results: resultId }).populate('results').exec();

      oldResults = [...round.results];

      round.results = round.results.filter((el) => el._id.toString() !== resultId);
      round.results = await setRankings(round.results, { ranksWithAverage: getRoundRanksWithAverage(round.format) });
      round.save(); // save the round for updateRecordsAfterDeletion

      await this.updateRecordsAfterDeletion(result, contest, event);

      // Delete the result
      await this.resultModel.deleteOne({ _id: resultId }).exec();

      const contestParticipants = await this.personsService.getContestParticipants({
        competitionId: contest.competitionId,
      });
      contest.participants = contestParticipants.length;
      await contest.save();

      const updatedRound = await this.roundModel
        .findOne({ competitionId, roundId: round.roundId }, excl)
        .populate('results')
        .exec();

      return updatedRound;
    } catch (err) {
      if (oldResults) {
        round.results = oldResults;
        await round.save();
      }

      await this.resetCancelledRecords(result, event, contest.state);

      throw new InternalServerErrorException(`Error while updating round during result deletion: ${err.message}`);
    }
  }

  async submitResult(submitResultDto: SubmitResultDto, user: IPartialUser) {
    const isAdmin = user.roles.includes(Role.Admin);

    // Disallow admin-only features
    if (!isAdmin) {
      if (!submitResultDto.videoLink) throw new UnauthorizedException('Please enter a video link');
      if (submitResultDto.attempts.some((a) => a.result === C.maxTime))
        throw new UnauthorizedException('You are not authorized to set unknown time');
    }

    if (!isAdmin) submitResultDto.unapproved = true;
    submitResultDto.date = new Date(submitResultDto.date);

    const event = await this.eventsService.getEventById(submitResultDto.eventId);

    await this.validateAndCleanUpResult(submitResultDto, event);

    const recordPairs = await this.getEventRecordPairs(event, { recordsUpTo: submitResultDto.date });
    let createdResult: ResultDocument;

    try {
      createdResult = await this.resultModel.create(
        setResultRecords(
          {
            ...submitResultDto,
            createdBy: new mongoose.Types.ObjectId(user._id as string),
          },
          event,
          recordPairs,
          !isAdmin,
        ),
      );
    } catch (err) {
      throw new InternalServerErrorException(`Error while submitting result: ${err.message}`);
    }

    if (isAdmin) {
      await this.resetCancelledRecords(submitResultDto, event);
    } else {
      let text = `A new ${submitResultDto.eventId} result has been submitted by user ${
        user.username
      }: ${getFormattedTime(createdResult.best)}`;
      if (createdResult.regionalSingleRecord) text += ` (${createdResult.regionalSingleRecord})`;
      if (createdResult.average > 0) {
        text += `, average: ${getFormattedTime(createdResult.average)}`;
        if (createdResult.regionalAverageRecord) text += ` (${createdResult.regionalAverageRecord})`;
      }
      text += '.';

      await this.emailService.sendEmail(C.contactEmail, text, { subject: 'New Result Submission' });
    }
  }

  async editResult(resultId: string, updateResultDto: UpdateResultDto) {
    const result = await this.resultModel.findOne({ _id: resultId }).exec();
    if (!result) throw new NotFoundException();

    if (!result.unapproved) {
      if (result.date.getTime() !== new Date(updateResultDto.date).getTime())
        throw new BadRequestException('The date may not be changed after a result has been approved');
    }

    const event = await this.eventsService.getEventById(result.eventId);
    const recordPairs = await this.getEventRecordPairs(event, { recordsUpTo: updateResultDto.date });
    const {best, average} = getBestAndAverage(updateResultDto.attempts, event, {roundFormat: ???})

    try {
      result.date = new Date(updateResultDto.date);
      result.personIds = updateResultDto.personIds;
      result.attempts = updateResultDto.attempts;
      result.best = best;
      result.average = average;
      result.videoLink = updateResultDto.videoLink;
      result.discussionLink = updateResultDto.discussionLink;

      setResultRecords(result, event, recordPairs);
    } catch (err) {
      throw new InternalServerErrorException('Error while editing result');
    }

    ////////////////////////////////
    // ADD THIS SOMEWHERE: this.validateAndCleanUpResult(result, event)
    ////////////////////////////////

    if (result.unapproved && !updateResultDto.unapproved) {
      result.unapproved = undefined;
      await this.resetCancelledRecords(updateResultDto, event);
    } else if (!result.unapproved && updateResultDto.unapproved) {
      throw new ForbiddenException('Setting a result as unapproved is forbidden');
    }

    try {
      await result.save();
    } catch (err) {
      throw new InternalServerErrorException('Error while saving result during update');
    }
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

  public async getEventRecordPairs(
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

        const [singleRecord] = await this.resultModel
          .find({ ...queryBase, ...getBaseSinglesFilter(event, { best: { $gt: 0 } }) })
          .sort({ best: 1 })
          .limit(1)
          .exec();

        if (singleRecord) recordPair.best = singleRecord.best;

        const [avgRecord] = await this.resultModel
          .find({ ...queryBase, ...getBaseAvgsFilter(event, { average: { $gt: 0 } }) })
          .sort({ average: 1 })
          .limit(1)
          .exec();

        if (avgRecord) recordPair.average = avgRecord.average;

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

    try {
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
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async resetRecordsCancelledByPublishedContest(competitionId: string) {
    const recordResults = await this.resultModel
      .find({
        competitionId,
        $or: [{ regionalSingleRecord: { $exists: true } }, { regionalAverageRecord: { $exists: true } }],
      })
      .exec();

    for (const res of recordResults) {
      this.logger.log(`Resetting records for ${res.eventId} from result: ${JSON.stringify(res)}`);
      await this.resetCancelledRecords(res);
    }
  }

  // Resets records set on the same day as the given result or after that day. If contest is set,
  // only resets the records for that contest (used only when creating contest result, not for submitting).
  private async resetCancelledRecords(
    result: CreateResultDto | ResultDocument,
    event?: EventDocument,
    state?: ContestState,
  ) {
    if (result.best <= 0 && result.average <= 0) return;
    if (!event) event = await this.eventsService.getEventById(result.eventId);

    this.logger.log(`Resetting ${event.eventId} records cancelled by result`);

    // If the contest isn't finished, only reset its own records. If it is, meaning the deletion is done by the admin,
    // reset ALL results that are no longer records. If contest is undefined, also do it for all results.
    const queryBase: any = { date: { $gte: result.date } };
    if (state && state < ContestState.Finished) queryBase.competitionId = result.competitionId;

    // TO-DO: IT IS POSSIBLE THAT THERE WAS STILL A RECORD, JUST OF A DIFFERENT TYPE
    try {
      // Remove cancelled single records
      if (result.best > 0) {
        await this.resultModel
          .updateMany(
            { ...queryBase, ...getBaseSinglesFilter(event, { best: { $gt: result.best } }) },
            { $unset: { regionalSingleRecord: '' } },
          )
          .exec();
      }

      // Remove cancelled average records
      if (result.average > 0) {
        await this.resultModel
          .updateMany(
            { ...queryBase, ...getBaseAvgsFilter(event, { average: { $gt: result.average } }) },
            { $unset: { regionalAverageRecord: '' } },
          )
          .exec();
      }
    } catch (err) {
      throw new InternalServerErrorException(`Error while resetting cancelled WRs: ${err.message}`);
    }
  }

  // Sets records that are now recognized after a contest result deletion. Does it for all days from the result's
  // date onward. If contest is set, only sets records for that contest, otherwise does it for ALL results.
  private async updateRecordsAfterDeletion(
    result: ResultDocument | CreateResultDto,
    contest: IContest,
    event?: EventDocument,
  ) {
    if (result.best <= 0 && result.average <= 0) return;
    if (!event) event = await this.eventsService.getEventById(result.eventId);

    // If the contest isn't finished, only update its own records. If it is, meaning the deletion is done by the admin,
    // update ALL results that are now records.
    const queryBase: any = { _id: { $ne: (result as any)._id }, date: { $gte: result.date } };
    if (contest.state < ContestState.Finished) queryBase.competitionId = result.competitionId;

    // This is done so that we get records BEFORE the date of the deleted result
    const recordsUpTo = new Date(result.date.getTime() - 1);
    const recordPairs = await this.getEventRecordPairs(event, { recordsUpTo });

    // TO-DO: DIFFERENT RECORD TYPES NEED TO BE PROPERLY SUPPORTED
    for (const rp of recordPairs) {
      try {
        // Set single records
        if (result.best > 0) {
          const bestFilter: any = { $gt: 0 };
          // Make sure it's better than the record at the time, if there was a record at all
          if (rp.best > 0) bestFilter.$lte = rp.best;

          await this.recordTypesService.setEventSingleRecords(event, rp.wcaEquivalent, {
            ...queryBase,
            ...getBaseSinglesFilter(event, { best: bestFilter }),
          });

          // Set average records
          if (result.average > 0) {
            const averageFilter: any = { $gt: 0 };
            // Make sure it's better than the record at the time, if there was a record at all
            if (rp.average > 0) averageFilter.$lte = rp.average;

            await this.recordTypesService.setEventAvgRecords(event, rp.wcaEquivalent, {
              ...queryBase,
              ...getBaseAvgsFilter(event, { average: averageFilter }),
            });
          }
        }
      } catch (err) {
        throw new InternalServerErrorException(
          `Error while updating ${rp.wcaEquivalent} records after result deletion: ${err.message}`,
        );
      }
    }
  }

  private async getContest(competitionId: string, user?: IPartialUser): Promise<ContestDocument> {
    let contest: ContestDocument;

    try {
      contest = await this.contestModel
        .findOne({ competitionId })
        .populate(orgPopulateOptions) // needed for access rights checking
        .exec();
    } catch (err) {
      throw new InternalServerErrorException(
        `Error while searching for competition with ID ${competitionId}:`,
        err.message,
      );
    }

    if (!contest) throw new BadRequestException(`Competition with ID ${competitionId} not found`);
    else if (user) this.authService.checkAccessRightsToContest(user, contest);

    return contest;
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
    { round }: { round?: IRound } = {}, // if round is defined, that means it's a contest result, not a submitted one
  ) {
    if (result.personIds.length !== (event.participants ?? 1))
      throw new BadRequestException(`This event must have ${event.participants ?? 1} participants`);

    // Remove empty attempts from the end
    for (let i = result.attempts.length - 1; i >= 0; i--) {
      if (result.attempts[i].result === 0) result.attempts = result.attempts.slice(0, -1);
      else break;
    }

    if (round) {
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
            .populate('results')
            .exec();

          for (const r of rounds) {
            const samePeoplesResult: IResult = r.results.find(
              (res) => !res.personIds.some((pid) => !result.personIds.includes(pid)),
            );

            if (samePeoplesResult) {
              for (const attempt of samePeoplesResult.attempts) total += attempt.result;
            }
          }

          if (total >= round.timeLimit.centiseconds)
            throw new BadRequestException(
              `This round has a cumulative time limit of ${getFormattedTime(round.timeLimit.centiseconds)}${
                round.timeLimit.cumulativeRoundIds.length === 1
                  ? ''
                  : ` for these rounds: ${round.timeLimit.cumulativeRoundIds.join(', ')}`
              }`,
            );
        }

        // Cutoff validation
        if (round.cutoff) {
          const passes = getMakesCutoff(result.attempts, round.cutoff);

          if (!passes && result.attempts.length > round.cutoff.numberOfAttempts)
            throw new BadRequestException(`This round has a cutoff of ${getFormattedTime(round.cutoff.attemptResult)}`);
        }
      }
    }
  }
}
