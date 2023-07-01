import { Test, TestingModule } from '@nestjs/testing';
import { CompetitionsService } from '../competitions.service';
import { getModelToken } from '@nestjs/mongoose';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { RecordTypesServiceMock } from '~/src/modules/record-types/tests/__mocks__/record-types.service';
import { activeRecordTypesStub } from '~/src/modules/record-types/tests/stubs/record-types.stub';
import { mockRoundModel } from './__mocks__/round.model';
import { mockResultModel } from './__mocks__/result.model';
import { newCompetitionEventsStub } from './stubs/new-competition-events.stub';
import { Model } from 'mongoose';
import { RoundDocument } from '~/src/models/round.model';
import { ResultDocument } from '~/src/models/result.model';
import { mockCompetitionModel } from './__mocks__/competition.model';
import { CompetitionDocument } from '~/src/models/competition.model';
import { competitionsStub } from './stubs/competitions.stub';
import { UpdateCompetitionDto } from '../dto/update-competition.dto';

describe('CompetitionsService', () => {
  let competitionsService: CompetitionsService;
  let competitionModel: Model<CompetitionDocument>;
  let roundModel: Model<RoundDocument>;
  let resultModel: Model<ResultDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompetitionsService,
        {
          provide: RecordTypesService,
          useValue: RecordTypesServiceMock,
        },
        {
          provide: getModelToken('Competition'),
          useFactory: mockCompetitionModel,
        },
        {
          provide: getModelToken('Round'),
          useFactory: mockRoundModel,
        },
        {
          provide: getModelToken('Result'),
          useFactory: mockResultModel,
        },
        {
          provide: getModelToken('Event'),
          useValue: {},
        },
        {
          provide: getModelToken('Person'),
          useValue: {},
        },
      ],
    }).compile();

    competitionsService = module.get<CompetitionsService>(CompetitionsService);
    competitionModel = module.get<Model<CompetitionDocument>>(getModelToken('Competition'));
    roundModel = module.get<Model<RoundDocument>>(getModelToken('Round'));
    resultModel = module.get<Model<ResultDocument>>(getModelToken('Result'));
  });

  it('should be defined', () => {
    expect(competitionsService).toBeDefined();
  });

  describe('Endpoint methods', () => {
    it('should update a competition', () => {
      const updateCompetitionDto = { events: newCompetitionEventsStub() } as UpdateCompetitionDto;
      competitionsService.updateCompetition('Munich30062023', updateCompetitionDto);
    });
  });

  describe('Helper methods', () => {
    it('gets current single records', async () => {
      const records: any = await competitionsService.getRecords(
        'regionalSingleRecord',
        '333fm',
        activeRecordTypesStub(),
      );
      expect(records.WR).toBe(39);
    });

    it('gets current average records', async () => {
      const records: any = await competitionsService.getRecords(
        'regionalAverageRecord',
        '666',
        activeRecordTypesStub(),
      );
      expect(records.WR).toBe(14594);
    });

    it('sets new records', async () => {
      const singleRecords: any = await competitionsService.getRecords(
        'regionalSingleRecord',
        '333',
        activeRecordTypesStub(),
      );
      const avgRecords: any = await competitionsService.getRecords(
        'regionalAverageRecord',
        '333',
        activeRecordTypesStub(),
      );

      const sameDayRounds = newCompetitionEventsStub()[0].rounds;
      competitionsService.setRecords(sameDayRounds, activeRecordTypesStub(), singleRecords, avgRecords);

      expect(singleRecords.WR).toBe(909);
      expect(avgRecords.WR).toBe(1132);
      expect(sameDayRounds[0].results[0].regionalAverageRecord).toBe('XWR');
    });

    it('updateCompetitionEvents sets events and participants correctly', async () => {
      const comp = competitionsStub()[3]; // gets the competition that hasn't had its results posted yet
      const newCompetitionEvents = newCompetitionEventsStub();

      await competitionsService.updateCompetitionEvents(comp, newCompetitionEvents);

      expect(comp.participants).toBe(4);
      expect(comp.events.length).toBe(1);
      expect(comp.events[0].rounds[0].results[0].best).toBe(686);
      expect(comp.events[0].rounds[0].results[0].average).toBe(800);
      expect(comp.events[0].rounds[0].results[0].regionalAverageRecord).toBe('XWR');
    });
  });
});
