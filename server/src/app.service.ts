import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { addMonths } from 'date-fns';
import { LogDocument } from '~/src/models/log.model';
import { UsersService } from '@m/users/users.service';
import { PersonsService } from '@m/persons/persons.service';
import { ResultsService } from '@m/results/results.service';
import { IAdminStats } from '@sh/interfaces';

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
}
