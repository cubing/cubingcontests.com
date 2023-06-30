import { Test, TestingModule } from '@nestjs/testing';
import { CompetitionsService } from '../competitions.service';
import { getModelToken } from '@nestjs/mongoose';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { RecordTypesServiceMock } from '@m/record-types/__mocks__/record-types.service';
import { activeRecordTypesStub } from '@m/record-types/test/stubs/record-types.stub';
import { mockRoundModel } from './__mocks__/round.model';
import { sameDayRounds } from './stubs/same-day-rounds.stub';
import { competition } from './stubs/competition.stub';
import { newCompetitionEvents } from './stubs/new-comp-events.stub';
import { Model } from 'mongoose';
import { RoundDocument } from '~/src/models/round.model';

describe('CompetitionsService', () => {
  let competitionsService: CompetitionsService;
  let roundModel: Model<RoundDocument>;

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
          useValue: {},
        },
        {
          provide: getModelToken('Round'),
          useValue: mockRoundModel,
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
    roundModel = module.get<Model<RoundDocument>>(getModelToken('Round'));
  });

  it('should be defined', () => {
    expect(competitionsService).toBeDefined();
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
      const rounds = sameDayRounds();
      competitionsService.setRecords(rounds, activeRecordTypesStub(), singleRecords, avgRecords);

      expect(singleRecords.WR).toBe(909);
      expect(avgRecords.WR).toBe(1132);
      expect(rounds[0].results[0].regionalAverageRecord).toBe('XWR');
    });

    it('updateCompetitionEvents sets events and participants correctly', async () => {
      const comp = competition();
      const newEvents = newCompetitionEvents();

      await competitionsService.updateCompetitionEvents(comp, newEvents);

      expect(comp.participants).toBe(4);
      expect(comp.events.length).toBeGreaterThan(0);
      expect(comp.events[0].rounds[0].results[0].regionalAverageRecord).toBe('XWR');
    });
  });
});
