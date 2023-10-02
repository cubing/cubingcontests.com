import { Injectable } from '@nestjs/common';
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
  ) {}

  async getAdminStats(): Promise<IAdminStats> {
    const adminStats: IAdminStats = {
      totalPersons: await this.personsService.getPersonsTotal(),
      totalUsers: await this.usersService.getUsersTotal(),
      totalResults: await this.resultsService.getTotalResults(),
      totalUnapprovedSubmittedResults: await this.resultsService.getTotalResults({
        competitionId: { $exists: false },
        unapproved: true,
      }),
    };

    return adminStats;
  }
}
