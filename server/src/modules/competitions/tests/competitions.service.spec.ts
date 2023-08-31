import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CompetitionsService } from '../competitions.service';
import { EventsService } from '@m/events/events.service';
import { ResultsService } from '@m/results/results.service';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { PersonsService } from '@m/persons/persons.service';
import { UpdateCompetitionDto } from '../dto/update-competition.dto';
import { Role } from '@sh/enums';

// Mocks and stubs
import { EventsServiceMock } from '@m/events/tests/mocks/events.service';
import { RecordTypesServiceMock } from '@m/record-types/tests/mocks/record-types.service';
import { ResultsServiceMock } from '@m/results/tests/mocks/results.service';
import { PersonsServiceMock } from '@m/persons/tests/mocks/persons.service';
import { CompetitionModelMock } from './mocks/competition.model';
import { RoundModelMock } from './mocks/round.model';
import { ResultModelMock } from '@m/results/tests/mocks/result.model';
import { newCompetitionEventsStub } from './stubs/new-competition-events.stub';

const mockUser = {
  username: 'user',
  personId: 1,
  roles: [Role.Admin],
};

describe('CompetitionsService', () => {
  let competitionsService: CompetitionsService;
  // let competitionModel: Model<CompetitionDocument>;
  // let roundModel: Model<RoundDocument>;
  // let resultModel: Model<ResultDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompetitionsService,
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

    competitionsService = module.get<CompetitionsService>(CompetitionsService);
    // competitionModel = module.get<Model<CompetitionDocument>>(getModelToken('Competition'));
    // roundModel = module.get<Model<RoundDocument>>(getModelToken('Round'));
    // resultModel = module.get<Model<ResultDocument>>(getModelToken('Result'));
  });

  it('should be defined', () => {
    expect(competitionsService).toBeDefined();
  });

  describe('Helper methods', () => {
    it('getParticipants works correctly', () => {
      const personIds = competitionsService.getParticipants(newCompetitionEventsStub());

      expect(personIds.length).toBe(4);
    });
  });
});
