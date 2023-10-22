import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { ContestsService } from '../contests.service';
import { EventsService } from '@m/events/events.service';
import { ResultsService } from '@m/results/results.service';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { PersonsService } from '@m/persons/persons.service';
import { AuthService } from '@m/auth/auth.service';

// Mocks and stubs
import { MyLoggerMock } from '@m/my-logger/tests/my-logger.service';
import { EventsServiceMock } from '@m/events/tests/mocks/events.service';
import { RecordTypesServiceMock } from '@m/record-types/tests/mocks/record-types.service';
import { ResultsServiceMock } from '@m/results/tests/mocks/results.service';
import { PersonsServiceMock } from '@m/persons/tests/mocks/persons.service';
import { AuthServiceMock } from '@m/auth/tests/mocks/auth.service';
import { CompetitionModelMock } from './mocks/contest.model';
import { RoundModelMock } from './mocks/round.model';
import { ResultModelMock } from '@m/results/tests/mocks/result.model';

describe('ContestsService', () => {
  let competitionsService: ContestsService;
  // let contestModel: Model<ContestDocument>;
  // let roundModel: Model<RoundDocument>;
  // let resultModel: Model<ResultDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContestsService,
        {
          provide: MyLogger,
          useFactory: MyLoggerMock,
        },
        {
          provide: EventsService,
          useFactory: EventsServiceMock,
        },
        {
          provide: ResultsService,
          useFactory: ResultsServiceMock,
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
          provide: getModelToken('Competition'),
          useFactory: CompetitionModelMock,
        },
        {
          provide: getModelToken('Round'),
          useFactory: RoundModelMock,
        },
        {
          provide: getModelToken('Result'),
          useFactory: ResultModelMock,
        },
        {
          provide: getModelToken('Schedule'),
          useValue: {},
        },
      ],
    }).compile();

    competitionsService = module.get<ContestsService>(ContestsService);
    // contestModel = module.get<Model<ContestDocument>>(getModelToken('Competition'));
    // roundModel = module.get<Model<RoundDocument>>(getModelToken('Round'));
    // resultModel = module.get<Model<ResultDocument>>(getModelToken('Result'));
  });

  it('should be defined', () => {
    expect(competitionsService).toBeDefined();
  });
});
