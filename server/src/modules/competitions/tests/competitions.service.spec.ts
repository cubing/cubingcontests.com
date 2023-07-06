import { Test, TestingModule } from '@nestjs/testing';
import { CompetitionsService } from '../competitions.service';
import { getModelToken } from '@nestjs/mongoose';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { RecordTypesServiceMock } from '@m/record-types/tests/__mocks__/record-types.service';
import { activeRecordTypesStub } from '@m/record-types/tests/stubs/record-types.stub';
import { mockRoundModel } from './__mocks__/round.model';
import { mockResultModel } from './__mocks__/result.model';
import { newCompetitionEventsStub, newFakeCompetitionEventsStub } from './stubs/new-competition-events.stub';
import { Model } from 'mongoose';
import { RoundDocument } from '~/src/models/round.model';
import { ResultDocument } from '~/src/models/result.model';
import { mockCompetitionModel } from './__mocks__/competition.model';
import { CompetitionDocument } from '~/src/models/competition.model';
// import { competitionsStub } from './stubs/competitions.stub';
import { UpdateCompetitionDto } from '../dto/update-competition.dto';
import IResult from '@sh/interfaces/Result';

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
    it('should update a competition without error', () => {
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

    it('sets new 3x3x3 records correctly', async () => {
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

      expect(singleRecords.WR).toBe(909);
      expect(avgRecords.WR).toBe(1132);

      const sameDayRounds = newCompetitionEventsStub()[0].rounds;
      await competitionsService.setRecords(sameDayRounds, activeRecordTypesStub(), singleRecords, avgRecords);

      expect(sameDayRounds[0].results[0].regionalAverageRecord).toBe('XWR');
    });

    it('sets new 3x3x3 FM records with multiple record-breaking results on the same day correctly', async () => {
      const singleRecords: any = await competitionsService.getRecords(
        'regionalSingleRecord',
        '333fm',
        activeRecordTypesStub(),
      );
      const avgRecords: any = await competitionsService.getRecords(
        'regionalAverageRecord',
        '333fm',
        activeRecordTypesStub(),
      );

      expect(singleRecords.WR).toBe(39);
      expect(avgRecords.WR).toBe(4600);

      const sameDayRounds = newCompetitionEventsStub()[1].rounds;
      await competitionsService.setRecords(sameDayRounds, activeRecordTypesStub(), singleRecords, avgRecords);

      expect(sameDayRounds[0].results[0].regionalSingleRecord).toBeUndefined();
      expect(sameDayRounds[0].results[0].regionalAverageRecord).toBe('XWR');
      expect(sameDayRounds[0].results[2].regionalSingleRecord).toBe('XWR');
    });

    it('sets new 3x3x3 FM records with ties correctly', async () => {
      const singleRecords: any = await competitionsService.getRecords(
        'regionalSingleRecord',
        '333fm',
        activeRecordTypesStub(),
      );
      const avgRecords: any = await competitionsService.getRecords(
        'regionalAverageRecord',
        '333fm',
        activeRecordTypesStub(),
      );

      const sameDayRounds = [newFakeCompetitionEventsStub()[0].rounds[0]];
      await competitionsService.setRecords(sameDayRounds, activeRecordTypesStub(), singleRecords, avgRecords);

      expect(sameDayRounds[0].results[0].regionalSingleRecord).toBe('XWR');
      expect(sameDayRounds[0].results[0].regionalAverageRecord).toBe('XWR');
      expect(sameDayRounds[0].results[1].regionalSingleRecord).toBe('XWR');
      expect(sameDayRounds[0].results[1].regionalAverageRecord).toBeUndefined();
    });

    it('sets multiple 2x2x2 records set in different rounds on the same day correctly', async () => {
      const singleRecords: any = await competitionsService.getRecords(
        'regionalSingleRecord',
        '222',
        activeRecordTypesStub(),
      );
      const avgRecords: any = await competitionsService.getRecords(
        'regionalAverageRecord',
        '222',
        activeRecordTypesStub(),
      );

      expect(singleRecords.WR).toBe(153);
      expect(avgRecords.WR).toBe(337);

      const sameDayRounds = newFakeCompetitionEventsStub()[1].rounds;
      await competitionsService.setRecords(sameDayRounds, activeRecordTypesStub(), singleRecords, avgRecords);

      // The single here is also better than XWR, but it should not be set,
      // because the next round has an even better single
      expect(sameDayRounds[0].results[0].regionalSingleRecord).toBeUndefined();
      expect(sameDayRounds[0].results[0].regionalAverageRecord).toBeUndefined();
      expect(sameDayRounds[1].results[0].regionalSingleRecord).toBe('XWR');
      expect(sameDayRounds[1].results[0].regionalAverageRecord).toBe('XWR');
    });

    it('updateCompetitionEvents sets events and participants correctly', async () => {
      const output = await competitionsService.updateCompetitionEvents(newCompetitionEventsStub());
      const singleRecord333Results = output.events[0].rounds[0].results.filter((el) => el.regionalSingleRecord);
      const avgRecord333Results = output.events[0].rounds[0].results.filter((el) => el.regionalAverageRecord);
      const singleRecord333fmResults = output.events[1].rounds[0].results.filter((el) => el.regionalSingleRecord);
      const avgRecord333fmResults = output.events[1].rounds[0].results.filter((el) => el.regionalAverageRecord);

      expect(output.participants).toBe(4);
      expect(output.events.length).toBe(2);
      expect(singleRecord333Results.length).toBe(1);
      expect(avgRecord333Results.length).toBe(1);
      expect(singleRecord333fmResults.length).toBe(1);
      expect(avgRecord333fmResults.length).toBe(1);
      // 6.86 single and 8.00 average XWRs
      expect(output.events[0].rounds[0].results[0].regionalSingleRecord).toBe('XWR');
      expect(output.events[0].rounds[0].results[0].regionalAverageRecord).toBe('XWR');
      // 32 single and 35.67 mean XWRs
      expect(output.events[1].rounds[0].results[2].regionalSingleRecord).toBe('XWR');
      expect(output.events[1].rounds[0].results[0].regionalAverageRecord).toBe('XWR');
    });

    it('updateCompetitionEvents sets events with multiple rounds on multiple days correctly', async () => {
      const output = await competitionsService.updateCompetitionEvents(newFakeCompetitionEventsStub());

      expect(output.participants).toBe(6);
      expect(output.events.length).toBe(2);

      const singleRecord333fmResults: IResult[] = [];
      const avgRecord333fmResults: IResult[] = [];

      // Get 3x3x3 FM results with records
      for (const round of output.events[0].rounds) {
        for (const result of round.results) {
          if (result.regionalSingleRecord) singleRecord333fmResults.push(result);
          if (result.regionalAverageRecord) avgRecord333fmResults.push(result);
        }
      }

      expect(singleRecord333fmResults.length).toBe(3);
      expect(avgRecord333fmResults.length).toBe(2);
      // 29 single x2 and 31.00 mean XWRs
      expect(output.events[0].rounds[0].results[0].regionalSingleRecord).toBe('XWR');
      expect(output.events[0].rounds[0].results[1].regionalSingleRecord).toBe('XWR');
      expect(output.events[0].rounds[0].results[0].regionalAverageRecord).toBe('XWR');
      // 28 single and 29.33 mean XWRs
      expect(output.events[0].rounds[1].results[0].regionalSingleRecord).toBe('XWR');
      expect(output.events[0].rounds[1].results[0].regionalAverageRecord).toBe('XWR');
      // Third day had no records, even though the results are better than the pre-comp records
      expect(output.events[0].rounds[2].results[0].regionalSingleRecord).toBeUndefined();
      expect(output.events[0].rounds[2].results[0].regionalAverageRecord).toBeUndefined();
    });
  });
});
