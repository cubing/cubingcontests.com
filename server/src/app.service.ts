import { Injectable, NotImplementedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { addMonths } from 'date-fns';
import { LogDocument } from '~/src/models/log.model';
import { UsersService } from '@m/users/users.service';
import { PersonsService } from '@m/persons/persons.service';
import { ResultsService } from '@m/results/results.service';
import { IAdminStats, IAttempt, IFePerson, IResult } from '@sh/types';
import { roundFormats } from '@sh/roundFormats';
import { EnterAttemptDto } from '~/src/app-dto/enter-attempt.dto';
import { EnterResultsDto } from './app-dto/enter-results.dto';

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
      unconfirmedUsers: await this.usersService.getUsersTotal({ unconfirmedOnly: true }),
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

    await this.logModel.deleteMany({ createdAt: { $lt: addMonths(new Date(), -1) } });

    return adminStats;
  }

  async enterAttemptFromExternalDevice(enterAttemptDto: EnterAttemptDto) {
    let person: IFePerson;

    if (enterAttemptDto.wcaId) {
      person = await this.personsService.getOrCreatePersonByWcaId(enterAttemptDto.wcaId.toUpperCase(), {
        user: 'EXT_DEVICE',
      });
    } else {
      person = await this.personsService.getPersonByPersonId(enterAttemptDto.registrantId);
    }

    const round = await this.resultsService.getContestRound(
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
    const round = await this.resultsService.getContestRound(
      enterResultsDto.competitionWcaId,
      enterResultsDto.eventId,
      enterResultsDto.roundNumber,
    );

    for (const externalResultDto of enterResultsDto.results) {
      const person = externalResultDto.wcaId
        ? await this.personsService.getPersonByWcaId(externalResultDto.wcaId.toUpperCase())
        : await this.personsService.getPersonById(externalResultDto.registrantId);

      if (!person) throw new NotFoundException(`Competitor ${externalResultDto.registrantId ? externalResultDto.registrantId : externalResultDto.wcaId} not found`);

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
        await this.resultsService.editResult((result as any)._id.toString(), newResultPartial);
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
}
