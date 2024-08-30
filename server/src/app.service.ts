import { Injectable, NotImplementedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { addMonths } from 'date-fns';
import { IAdminStats, IAttempt, IResult } from '@sh/types';
import { roundFormats } from '@sh/roundFormats';
import { LogDocument } from '~/src/models/log.model';
import { ContestsService } from '@m/contests/contests.service';
import { UsersService } from '@m/users/users.service';
import { PersonsService } from '@m/persons/persons.service';
import { ResultsService } from '@m/results/results.service';
import { EnterAttemptDto } from '~/src/app-dto/enter-attempt.dto';
import { EnterResultsDto, ExternalResultDto } from './app-dto/enter-results.dto';

@Injectable()
export class AppService {
  constructor(
    private contestsService: ContestsService,
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
      unconfirmedUsers: await this.usersService.getUsersTotal({ unconfirmedOnly: true }),
      totalResults: await this.resultsService.getTotalResults(),
      totalUnapprovedSubmittedResults: await this.resultsService.getTotalResults({
        competitionId: { $exists: false },
        unapproved: true,
      }),
      analytics: [],
    };

    adminStats.analytics.push({
      label: 'Contests list views',
      value: await this.logModel.countDocuments({ type: 'get_contests', createdAt: { $gte: oneMonthAgo } }).exec(),
    });
    adminStats.analytics.push({
      label: 'Contest page views',
      value: await this.logModel.countDocuments({ type: 'get_contest', createdAt: { $gte: oneMonthAgo } }).exec(),
    });
    adminStats.analytics.push({
      label: 'Rankings views',
      value: await this.logModel.countDocuments({ type: 'get_rankings', createdAt: { $gte: oneMonthAgo } }).exec(),
    });
    adminStats.analytics.push({
      label: 'Records views',
      value: await this.logModel.countDocuments({ type: 'get_records', createdAt: { $gte: oneMonthAgo } }).exec(),
    });
    adminStats.analytics.push({
      label: 'Users registered',
      value: await this.logModel.countDocuments({ type: 'create_user', createdAt: { $gte: oneMonthAgo } }).exec(),
    });
    adminStats.analytics.push({
      label: 'Mod dashboard views',
      value: await this.logModel.countDocuments({ type: 'get_mod_contests', createdAt: { $gte: oneMonthAgo } }).exec(),
    });
    adminStats.analytics.push({
      label: 'Edit contest / data entry page views',
      value: await this.logModel.countDocuments({ type: 'get_mod_contest', createdAt: { $gte: oneMonthAgo } }).exec(),
    });
    adminStats.analytics.push({
      label: 'Contests created',
      value: await this.logModel.countDocuments({ type: 'create_contest', createdAt: { $gte: oneMonthAgo } }).exec(),
    });
    adminStats.analytics.push({
      label: 'Persons created',
      value: await this.logModel.countDocuments({ type: 'create_person', createdAt: { $gte: oneMonthAgo } }).exec(),
    });
    adminStats.analytics.push({
      label: 'Events created',
      value: await this.logModel.countDocuments({ type: 'create_event', createdAt: { $gte: oneMonthAgo } }).exec(),
    });
    adminStats.analytics.push({
      label: 'Event updates',
      value: await this.logModel.countDocuments({ type: 'update_event', createdAt: { $gte: oneMonthAgo } }).exec(),
    });
    adminStats.analytics.push({
      label: 'Results created',
      value: await this.logModel.countDocuments({ type: 'create_result', createdAt: { $gte: oneMonthAgo } }).exec(),
    });
    adminStats.analytics.push({
      label: 'Results submitted',
      value: await this.logModel.countDocuments({ type: 'submit_result', createdAt: { $gte: oneMonthAgo } }).exec(),
    });
    adminStats.analytics.push({
      label: 'Results deleted',
      value: await this.logModel.countDocuments({ type: 'delete_result', createdAt: { $gte: oneMonthAgo } }).exec(),
    });
    adminStats.analytics.push({
      label: 'Record types updates',
      value: await this.logModel
        .countDocuments({ type: 'update_record_types', createdAt: { $gte: oneMonthAgo } })
        .exec(),
    });

    await this.logModel.deleteMany({ createdAt: { $lt: addMonths(new Date(), -1) } });

    return adminStats;
  }

  async enterAttemptFromExternalDevice(enterAttemptDto: EnterAttemptDto) {
    const person = await this.getPersonForExtDeviceDataEntry(enterAttemptDto);
    const round = await this.contestsService.getContestRound(
      enterAttemptDto.competitionWcaId,
      enterAttemptDto.eventId,
      enterAttemptDto.roundNumber,
    );
    const result: IResult | undefined = round.results.find(
      (r) => r.personIds.length === 1 && r.personIds[0] === person.personId,
    );
    const roundFormat = roundFormats.find((rf) => rf.value === round.format);
    const attempts: IAttempt[] = [];

    if (result && result.personIds.length > 1)
      throw new NotImplementedException('External data entry for team events is not supported yet');

    for (let i = 0; i < roundFormat.attempts; i++) {
      if (i === enterAttemptDto.attemptNumber - 1) attempts.push({ result: enterAttemptDto.attemptResult });
      else if (result?.attempts[i]) attempts.push(result.attempts[i]);
      else attempts.push({ result: 0 });
    }

    const newResultPartial = {
      date: null as Date, // real date assigned below
      unapproved: true, // it's not allowed to enter a new attempt for a finished contest anyways
      // TO-DO: ADD PROPER SUPPORT FOR TEAM EVENTS!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      personIds: [person.personId],
      attempts,
    };

    if (result) {
      await this.resultsService.updateResult((result as any)._id.toString(), newResultPartial);
    } else {
      await this.resultsService.createResult(
        {
          ...newResultPartial,
          eventId: enterAttemptDto.eventId,
          competitionId: enterAttemptDto.competitionWcaId,
          best: null,
          average: null,
        },
        round.roundId,
      );
    }
  }

  async enterResultsFromExternalDevice(enterResultsDto: EnterResultsDto) {
    const round = await this.contestsService.getContestRound(
      enterResultsDto.competitionWcaId,
      enterResultsDto.eventId,
      enterResultsDto.roundNumber,
    );

    for (const externalResultDto of enterResultsDto.results) {
      const person = await this.getPersonForExtDeviceDataEntry(externalResultDto);
      const result: IResult | undefined = round.results.find(
        (r) => r.personIds.length === 1 && r.personIds[0] === person.personId,
      );

      const newResultPartial = {
        date: null as Date,
        unapproved: true,
        personIds: [person.personId],
        attempts: externalResultDto.attempts,
      };

      if (result) {
        await this.resultsService.updateResult((result as any)._id.toString(), newResultPartial);
      } else {
        await this.resultsService.createResult(
          {
            ...newResultPartial,
            eventId: enterResultsDto.eventId,
            competitionId: enterResultsDto.competitionWcaId,
            best: null,
            average: null,
          },
          round.roundId,
        );
      }
    }
  }

  private async getPersonForExtDeviceDataEntry({ wcaId, registrantId }: EnterAttemptDto | ExternalResultDto) {
    if (wcaId) {
      const res = await this.personsService.getOrCreatePersonByWcaId(wcaId.toUpperCase(), { user: 'EXT_DEVICE' });
      return res.person;
    } else {
      return await this.personsService.getPersonByPersonId(registrantId);
    }
  }
}
