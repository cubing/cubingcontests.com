import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { addMonths } from 'date-fns';
import { LogDocument } from '~/src/models/log.model';
import { RoundDocument } from '~/src/models/round.model';
import { UsersService } from '@m/users/users.service';
import { PersonsService } from '@m/persons/persons.service';
import { ResultsService } from '@m/results/results.service';
import { IAdminStats, IAttempt } from '@sh/interfaces';
import { EnterAttemptDto } from '~/src/app-dto/enter-attempt.dto';
import { getBestAndAverage } from '@sh/sharedFunctions';

@Injectable()
export class AppService {
  constructor(
    private resultsService: ResultsService,
    private personsService: PersonsService,
    private usersService: UsersService,
    @InjectModel('Log') private readonly logModel: Model<LogDocument>,
    @InjectModel('Round') private readonly roundModel: Model<RoundDocument>,
  ) {}

  async getAdminStats(): Promise<IAdminStats> {
    const oneMonthAgo = addMonths(new Date(), -1);

    const adminStats: IAdminStats = {
      totalPersons: await this.personsService.getPersonsTotal(),
      totalUsers: await this.usersService.getUsersTotal(),
      totalResults: await this.resultsService.getTotalResults(),
      totalUnapprovedSubmittedResults: await this.resultsService.getTotalResults({
        competitionId: { $exists: false },
        unapproved: true,
      }),
      analytics: {
        getContests: await this.logModel
          .countDocuments({ type: 'get_contests', createdAt: { $gte: oneMonthAgo } })
          .exec(),
        getModContests: await this.logModel
          .countDocuments({ type: 'get_mod_contests', createdAt: { $gte: oneMonthAgo } })
          .exec(),
        getContest: await this.logModel
          .countDocuments({ type: 'get_contest', createdAt: { $gte: oneMonthAgo } })
          .exec(),
        getModContest: await this.logModel
          .countDocuments({ type: 'get_mod_contest', createdAt: { $gte: oneMonthAgo } })
          .exec(),
        createContest: await this.logModel
          .countDocuments({ type: 'create_contest', createdAt: { $gte: oneMonthAgo } })
          .exec(),
        updateContest: await this.logModel
          .countDocuments({ type: 'update_contest', createdAt: { $gte: oneMonthAgo } })
          .exec(),
        updateContestState: await this.logModel
          .countDocuments({ type: 'update_contest_state', createdAt: { $gte: oneMonthAgo } })
          .exec(),
        createPerson: await this.logModel
          .countDocuments({ type: 'create_person', createdAt: { $gte: oneMonthAgo } })
          .exec(),
        createEvent: await this.logModel
          .countDocuments({ type: 'create_event', createdAt: { $gte: oneMonthAgo } })
          .exec(),
        updateEvent: await this.logModel
          .countDocuments({ type: 'update_event', createdAt: { $gte: oneMonthAgo } })
          .exec(),
        getRankings: await this.logModel
          .countDocuments({ type: 'get_rankings', createdAt: { $gte: oneMonthAgo } })
          .exec(),
        getRecords: await this.logModel
          .countDocuments({ type: 'get_records', createdAt: { $gte: oneMonthAgo } })
          .exec(),
        createResult: await this.logModel
          .countDocuments({ type: 'create_result', createdAt: { $gte: oneMonthAgo } })
          .exec(),
        deleteResult: await this.logModel
          .countDocuments({ type: 'delete_result', createdAt: { $gte: oneMonthAgo } })
          .exec(),
        submitResult: await this.logModel
          .countDocuments({ type: 'submit_result', createdAt: { $gte: oneMonthAgo } })
          .exec(),
        updateResult: await this.logModel
          .countDocuments({ type: 'update_result', createdAt: { $gte: oneMonthAgo } })
          .exec(),
        updateRecordTypes: await this.logModel
          .countDocuments({ type: 'update_record_types', createdAt: { $gte: oneMonthAgo } })
          .exec(),
        createUser: await this.logModel
          .countDocuments({ type: 'create_user', createdAt: { $gte: oneMonthAgo } })
          .exec(),
        updateUser: await this.logModel
          .countDocuments({ type: 'update_user', createdAt: { $gte: oneMonthAgo } })
          .exec(),
      },
    };

    return adminStats;
  }

  async enterAttemptFromExternalDevice(enterAttemptDto: EnterAttemptDto) {
    const { result, contestEvent } = await this.resultsService.getContestResultAndEvent(
      enterAttemptDto.competitionWcaId,
      enterAttemptDto.eventId,
      enterAttemptDto.roundNumber,
      enterAttemptDto.registrantId,
    );
    const round = contestEvent.rounds[enterAttemptDto.roundNumber - 1];
    const attempts: IAttempt[] = [];

    // If the result already exists, delete it first
    if (result) {
      if (result.attempts[enterAttemptDto.attemptNumber - 1])
        throw new BadRequestException('This attempt has already been entered');

      await this.resultsService.deleteContestResult(result._id.toString(), result.competitionId);

      attempts.push(...result.attempts);
    } else {
      if (!(await this.personsService.getPersonById(enterAttemptDto.registrantId)))
        throw new NotFoundException(`Person with ID ${enterAttemptDto.registrantId} not found`);

      if (enterAttemptDto.attemptNumber !== 1) throw new BadRequestException('You must first enter the first attempt');
    }

    attempts.push({ result: enterAttemptDto.attemptResult });

    const { best, average } = getBestAndAverage(attempts, contestEvent.event, round);
    const newResult = {
      competitionId: enterAttemptDto.competitionWcaId,
      eventId: enterAttemptDto.eventId,
      date: new Date(), // real date assigned in createResult
      unapproved: true,
      personIds: [enterAttemptDto.registrantId], // TO-DO: ADD SUPPORT FOR TEAM EVENTS!!!!!!!!!!!!!!!!!!!!!!!!!!
      attempts,
      best,
      average,
    };

    await this.resultsService.createResult(newResult, round.roundId);
  }
}
