import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import C from '@sh/constants';
import { MyLogger } from '~/src/modules/my-logger/my-logger.service';
import { EventsService } from '@m/events/events.service';
import { ResultsService } from '@m/results/results.service';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { PersonsService } from '@m/persons/persons.service';
import { AuthService } from '@m/auth/auth.service';
import { UsersService } from '@m/users/users.service';
import { EmailService } from '@m/email/email.service';
import { Role, WcaRecordType } from '@sh/enums';
import { IEventRankings } from '@sh/types';
import { IPartialUser } from '~/src/helpers/interfaces/User';
import { ResultDocument } from '~/src/models/result.model';

// Mocks and stubs
import { MyLoggerMock } from '~/src/modules/my-logger/tests/my-logger.service';
import { EventsServiceMock } from '@m/events/tests/mocks/events.service';
import { RecordTypesServiceMock } from '@m/record-types/tests/mocks/record-types.service';
import { PersonsServiceMock } from '@m/persons/tests/mocks/persons.service';
import { ResultModelMock } from '@m/results/tests/mocks/result.model';
import { RoundModelMock } from '~/src/modules/contests/tests/mocks/round.model';
import { ContestModelMock } from '~/src/modules/contests/tests/mocks/contest.model';
import { AuthServiceMock } from '@m/auth/tests/mocks/auth.service';
import { CreateResultDto } from '../dto/create-result.dto';
import { SubmitResultDto } from '~/src/modules/results/dto/submit-result.dto';

const adminUser: IPartialUser = {
  personId: 1,
  username: 'adminuser',
  roles: [Role.Admin],
};
const modUser: IPartialUser = {
  personId: 2,
  username: 'moduser',
  roles: [Role.Moderator],
};

describe('ResultsService', () => {
  let resultsService: ResultsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultsService,
        {
          provide: MyLogger,
          useFactory: MyLoggerMock,
        },
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
          provide: UsersService,
          useValue: {},
        },
        {
          provide: EmailService,
          useValue: {},
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
          useFactory: ContestModelMock,
        },
        {
          provide: getModelToken('Schedule'),
          useValue: {},
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
      expect(records333.rankings[0].result).toBe(909); // single
      expect(records333.rankings[1].result).toBe(1132); // single
      // Check 3x3x3 FM records (they should have a tie)
      expect(records333fm.rankings.length).toBe(3);
      expect(records333fm.rankings[0].result).toBe(39); // single
      expect(records333fm.rankings[1].result).toBe(39); // single
      expect(records333fm.rankings[2].result).toBe(4600); // mean
    });

    describe('createResult', () => {
      it('creates new 3x3x3 result', async () => {
        const newResult: CreateResultDto = {
          eventId: '333',
          competitionId: 'Munich19022023',
          date: new Date('2023-02-19T00:00:00Z'),
          unapproved: true,
          personIds: [99],
          ranking: 0,
          attempts: [{ result: 1054 }, { result: 1342 }, { result: 942 }, { result: 999 }, { result: 1115 }],
          best: 942,
          average: 1056,
        };

        await resultsService.createResult(newResult, '333-r1', { user: adminUser });
        const createdResult = newResult as ResultDocument; // createResult directly edits newResult

        expect(createdResult.regionalSingleRecord).toBe('WR');
        expect(createdResult.regionalAverageRecord).toBe('WR');
      });

      it('throws an error when the round is not found', async () => {
        await expect(
          resultsService.createResult(
            { competitionId: 'Munich19022023', eventId: '333' } as CreateResultDto,
            '333-INVALID_ROUND_NUMBER',
            { user: adminUser },
          ),
        ).rejects.toThrowError(new BadRequestException('Round not found'));
      });

      it('throws an error when the number of competitors in the result is wrong', async () => {
        await expect(
          resultsService.createResult(
            { competitionId: 'Munich19022023', eventId: '333', personIds: [1, 2, 3] } as CreateResultDto,
            '333-r1',
            { user: adminUser },
          ),
        ).rejects.toThrowError(new BadRequestException('This event must have 1 participant'));
      });

      it('throws an error when the number of non-empty attempts is 0', async () => {
        await expect(
          resultsService.createResult(
            {
              competitionId: 'Munich19022023',
              eventId: '333',
              personIds: [1],
              attempts: [{ result: 0 }],
            } as CreateResultDto,
            '333-r1',
            { user: adminUser },
          ),
        ).rejects.toThrowError(new BadRequestException('Please enter at least one attempt'));
      });
    });

    describe('submitResult', () => {
      it('submits new 4x4x4 Blindfolded result', async () => {
        const newResult: SubmitResultDto = {
          eventId: '444bf',
          competitionId: 'Munich19022023',
          date: new Date('2024-08-11T00:00:00Z'),
          unapproved: true,
          personIds: [99],
          ranking: 0,
          attempts: [{ result: 10085 }],
          best: 10085,
          average: 0,
          videoLink: 'link.com',
        };

        const createdResult = await resultsService.submitResult(newResult, adminUser);

        expect(createdResult.regionalSingleRecord).toBeUndefined();
        expect(createdResult.regionalAverageRecord).toBeUndefined();
      });

      it('throws an error when there is no video link', async () => {
        await expect(
          resultsService.submitResult(
            {
              eventId: '444bf',
              personIds: [1],
              attempts: [{ result: 10000 }],
              videoLink: undefined,
            } as SubmitResultDto,
            adminUser,
          ),
        ).rejects.toThrowError(new BadRequestException('Please enter a video link'));
      });

      it('throws an error when a non-admin submits a result with an empty video link', async () => {
        await expect(
          resultsService.submitResult(
            {
              eventId: '444bf',
              personIds: [1],
              attempts: [{ result: 10000 }],
              videoLink: '',
            } as SubmitResultDto,
            modUser,
          ),
        ).rejects.toThrowError(new BadRequestException('Please enter a video link'));
      });

      it('throws an error when a non-admin submits a result with unknown time', async () => {
        await expect(
          resultsService.submitResult(
            {
              eventId: '444bf',
              personIds: [1],
              attempts: [{ result: C.maxTime }],
              videoLink: 'link.com',
            } as SubmitResultDto,
            modUser,
          ),
        ).rejects.toThrowError(new BadRequestException('You are not authorized to set unknown time'));
      });
    });

    // describe('editResult', () => {});

    // describe('deleteResult', () => {});
  });
});
