import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EventsService } from '@m/events/events.service';
import { ResultsService } from '@m/results/results.service';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { PersonsService } from '@m/persons/persons.service';
import { AuthService } from '@m/auth/auth.service';
import { Role, WcaRecordType } from '@sh/enums';
import { IEventRankings } from '@sh/interfaces';
import { IPartialUser } from '~/src/helpers/interfaces/User';

// Mocks and stubs
import { EventsServiceMock } from '@m/events/tests/mocks/events.service';
import { RecordTypesServiceMock } from '@m/record-types/tests/mocks/record-types.service';
import { PersonsServiceMock } from '@m/persons/tests/mocks/persons.service';
import { ResultModelMock } from '@m/results/tests/mocks/result.model';
import { RoundModelMock } from '@m/competitions/tests/mocks/round.model';
import { CompetitionModelMock } from '@m/competitions/tests/mocks/competition.model';
import { AuthServiceMock } from '@m/auth/tests/mocks/auth.service';
import { CreateResultDto } from '../dto/create-result.dto';

const mockUser: IPartialUser = {
  personId: 1,
  username: 'testuser',
  roles: [Role.Admin],
};

describe('ResultsService', () => {
  let resultsService: ResultsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultsService,
        {
          provide: EventsService,
          useFactory: EventsServiceMock,
        },
        {
          provide: RecordTypesService,
          useFactory: RecordTypesServiceMock,
        },
        {
          provide: PersonsService,
          useFactory: PersonsServiceMock,
        },
        {
          provide: AuthService,
          useFactory: AuthServiceMock,
        },
        {
          provide: getModelToken('Result'),
          useFactory: ResultModelMock,
        },
        {
          provide: getModelToken('Round'),
          useFactory: RoundModelMock,
        },
        {
          provide: getModelToken('Competition'),
          useFactory: CompetitionModelMock,
        },
      ],
    }).compile();

    resultsService = module.get<ResultsService>(ResultsService);
  });

  describe('Endpoints', () => {
    it('gets current records', async () => {
      const eventRecords = await resultsService.getRecords(WcaRecordType.WR);
      const records333 = eventRecords.find((el: IEventRankings) => el.event.eventId === '333');
      const records333fm = eventRecords.find((el: IEventRankings) => el.event.eventId === '333fm');

      // Check 3x3x3 records
      expect(records333.rankings.length).toBe(2);
      expect(records333.rankings[0].result.best).toBe(909);
      expect(records333.rankings[1].result.average).toBe(1132);
      // Check 3x3x3 FM records (they should have a tie)
      expect(records333fm.rankings.length).toBe(3);
      expect(records333fm.rankings[0].result.best).toBe(39);
      expect(records333fm.rankings[1].result.best).toBe(39);
      expect(records333fm.rankings[2].result.average).toBe(4600);
    });

    describe('createResult', () => {
      it('creates new 3x3x3 result without error', async () => {
        const newResult: CreateResultDto = {
          eventId: '333',
          competitionId: 'Munich19022023',
          date: new Date('2023-02-19T00:00:00Z'),
          compNotPublished: true,
          personIds: [99],
          ranking: 0,
          attempts: [1054, 1342, 942, 999, 1115],
          best: 942,
          average: 1056,
        };

        await resultsService.createResult(newResult, '333-r1', mockUser);

        expect(newResult.regionalSingleRecord).toBe('WR');
        expect(newResult.regionalAverageRecord).toBe('WR');
      });
    });

    // describe('deleteCompetitionResult', () => {});

    // describe('submitResult', () => {});
  });
});
