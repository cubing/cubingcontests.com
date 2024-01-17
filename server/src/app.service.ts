import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { addMonths } from 'date-fns';
import { LogDocument } from '~/src/models/log.model';
import { UsersService } from '@m/users/users.service';
import { PersonsService } from '@m/persons/persons.service';
import { ResultsService } from '@m/results/results.service';
import { IAdminStats, IAttempt } from '@sh/interfaces';
import { EnterAttemptDto } from '~/src/app-dto/enter-attempt.dto';
import { getBestAndAverage, getMakesCutoff } from '~~/client/shared_helpers/sharedFunctions';
import { roundFormats } from '~~/client/shared_helpers/roundFormats';

@Injectable()
export class AppService {
  constructor(
    private resultsService: ResultsService,
    private personsService: PersonsService,
    private usersService: UsersService,
    @InjectModel('Log') private readonly logModel: Model<LogDocument>,
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
    const format = roundFormats.find((rf) => rf.value === round.format);

    if (result) {
      const existingAttempt = result.attempts[enterAttemptDto.attemptNumber - 1];
      if (!existingAttempt)
        throw new BadRequestException(`Attempt number ${enterAttemptDto.attemptNumber} does not exist`);
      if (existingAttempt.result !== -2) throw new BadRequestException('This attempt has already been entered');

      existingAttempt.result = enterAttemptDto.attemptResult;

      // If the cutoff is met now, but wasn't before, fill in the rest of the attempts with DNS
      if (result.attempts.length < format.attempts && getMakesCutoff(result.attempts, round.cutoff)) {
        result.attempts = [
          ...result.attempts,
          ...new Array(format.attempts - result.attempts.length).fill({ result: -2 }),
        ];
      }

      await result.save();
    } else if (enterAttemptDto.attemptNumber === 1) {
      const person = await this.personsService.getPersonById(enterAttemptDto.registrantId);

      if (!person) throw new NotFoundException(`Person with ID ${enterAttemptDto.registrantId} not found`);

      let attempts: IAttempt[] = [
        { result: enterAttemptDto.attemptResult },
        ...new Array(format.attempts - 1).fill({ result: -2 }), // fill the rest of the attempts with DNS
      ];
      if (!getMakesCutoff(attempts, round.cutoff)) attempts = attempts.slice(0, round.cutoff.numberOfAttempts);
      const { best, average } = getBestAndAverage(
        attempts,
        contestEvent.event,
        contestEvent.rounds[enterAttemptDto.roundNumber - 1].cutoff,
      );

      await this.resultsService.createResult(
        {
          competitionId: enterAttemptDto.competitionWcaId,
          eventId: enterAttemptDto.eventId,
          date: new Date(), // real date assigned in createResult
          unapproved: true,
          personIds: [enterAttemptDto.registrantId],
          attempts,
          best,
          average,
        },
        `${enterAttemptDto.eventId}-r${enterAttemptDto.roundNumber}`,
      );
    } else {
      throw new BadRequestException('You must first enter the first attempt');
    }
  }
}
