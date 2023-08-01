import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CompetitionsService } from '../competitions.service';
import { EventsService } from '@m/events/events.service';
import { ResultsService } from '@m/results/results.service';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { PersonsService } from '@m/persons/persons.service';
import { IResult, IRound } from '@sh/interfaces';
import { UpdateCompetitionDto } from '../dto/update-competition.dto';
import { recordTypesStub, setNewRecords } from '@sh/sharedFunctions';
import { RoundFormat, RoundType } from '@sh/enums';

// Mocks and stubs
import { EventsServiceMock } from '@m/events/tests/mocks/events.service';
import { ResultsServiceMock } from '@m/results/tests/mocks/results.service';
import { RecordTypesServiceMock } from '@m/record-types/tests/mocks/record-types.service';
import { PersonsServiceMock } from '@m/persons/tests/mocks/persons.service';
import { mockCompetitionModel } from './mocks/competition.model';
import { mockRoundModel } from './mocks/round.model';
import { mockResultModel } from '@m/results/tests/mocks/result.model';
import { activeRecordTypesStub } from '@m/record-types/tests/stubs/active-record-types.stub';
import { newCompetitionEventsStub, newFakeCompetitionEventsStub } from './stubs/new-competition-events.stub';
import { Role } from '~/src/helpers/enums';

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

  describe('Endpoints', () => {
    it('should get full competition', async () => {
      const { competition, persons } = await competitionsService.getCompetition('Munich19022023');

      expect(competition.name).toBe('Meetup in Munich on February 19, 2023');
      expect(competition.events.length).toBe(4);
      expect(persons.length).toBe(4);
    });

    it('should get full moderator competition', async () => {
      const { competition, persons, records } = await competitionsService.getModCompetition('Munich14062023');

      expect(competition).toBeDefined();
      expect(persons.length).toBe(5);
      expect(competition.events.length).toBe(7);
      expect(records['333'].WR.best).toBe(990);
      expect(records['333'].WR.average).toBe(1170);
    });
  });

  describe('Endpoint methods', () => {
    it('should post competition results without error', () => {
      const updateCompetitionDto = { events: newCompetitionEventsStub() } as UpdateCompetitionDto;
      competitionsService.postResults('Munich30062023', updateCompetitionDto);
    });

    it('should update competition results without error', () => {
      const updateCompetitionDto = { events: newCompetitionEventsStub() } as UpdateCompetitionDto;
      competitionsService.postResults('Munich27062023', updateCompetitionDto);
    });
  });

  describe('Helper methods', () => {
    it('gets current 3x3x3 BLD records', async () => {
      const records: any = await competitionsService.getEventRecords('333bf', activeRecordTypesStub());

      expect(records.WR.best).toBe(2217);
      expect(records.WR.average).toBe(2795);
    });

    it('sets new 3x3x3 records correctly', async () => {
      const records: any = await competitionsService.getEventRecords('333', activeRecordTypesStub());

      expect(records.WR.best).toBe(909);
      expect(records.WR.average).toBe(1132);

      const sameDayRounds = newCompetitionEventsStub()[0].rounds;
      await competitionsService.setRecordsAndSaveResults(sameDayRounds, activeRecordTypesStub(), records);

      expect(sameDayRounds[0].results[0].regionalAverageRecord).toBe('XWR');
      expect(sameDayRounds[0].results[0].regionalSingleRecord).toBe('XWR');
    });

    it('sets new 3x3x3 FM records with multiple record-breaking results on the same day correctly', async () => {
      const records: any = await competitionsService.getEventRecords('333fm', activeRecordTypesStub());

      expect(records.WR.best).toBe(39);
      expect(records.WR.average).toBe(4600);

      const sameDayRounds = newCompetitionEventsStub()[1].rounds;
      await competitionsService.setRecordsAndSaveResults(sameDayRounds, activeRecordTypesStub(), records);

      expect(sameDayRounds[0].results[0].regionalSingleRecord).toBeUndefined();
      expect(sameDayRounds[0].results[0].regionalAverageRecord).toBe('XWR');
      expect(sameDayRounds[0].results[2].regionalSingleRecord).toBe('XWR');
    });

    it('sets new 3x3x3 FM records with ties correctly', async () => {
      const records: any = await competitionsService.getEventRecords('333fm', activeRecordTypesStub());

      const sameDayRounds = [newFakeCompetitionEventsStub()[0].rounds[0]];
      await competitionsService.setRecordsAndSaveResults(sameDayRounds, activeRecordTypesStub(), records);

      expect(sameDayRounds[0].results[0].regionalSingleRecord).toBe('XWR');
      expect(sameDayRounds[0].results[0].regionalAverageRecord).toBe('XWR');
      expect(sameDayRounds[0].results[1].regionalSingleRecord).toBe('XWR');
      expect(sameDayRounds[0].results[1].regionalAverageRecord).toBeUndefined();
    });

    it('sets multiple 2x2x2 records set in different rounds on the same day correctly', async () => {
      const records: any = await competitionsService.getEventRecords('222', activeRecordTypesStub());

      expect(records.WR.best).toBe(153);
      expect(records.WR.average).toBe(337);

      const sameDayRounds = newFakeCompetitionEventsStub()[1].rounds;
      await competitionsService.setRecordsAndSaveResults(sameDayRounds, activeRecordTypesStub(), records);

      // The single here is also better than XWR, but it should not be set,
      // because the next round has an even better single
      expect(sameDayRounds[0].results[0].regionalSingleRecord).toBeUndefined();
      expect(sameDayRounds[0].results[0].regionalAverageRecord).toBeUndefined();
      expect(sameDayRounds[1].results[0].regionalSingleRecord).toBe('XWR');
      expect(sameDayRounds[1].results[0].regionalAverageRecord).toBe('XWR');
    });

    it('updateCompetitionResults sets events and participants correctly', async () => {
      const output = await competitionsService.updateCompetitionResults(
        newCompetitionEventsStub(),
        recordTypesStub(true),
      );
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
      expect(output.events[0].rounds[0].results[0].best).toBe(686);
      expect(output.events[0].rounds[0].results[0].regionalAverageRecord).toBe('XWR');
      // 32 single and 35.67 mean XWRs
      expect(output.events[1].rounds[0].results[2].regionalSingleRecord).toBe('XWR');
      expect(output.events[1].rounds[0].results[0].regionalAverageRecord).toBe('XWR');
    });

    it('updateCompetitionResults sets events with multiple rounds on multiple days correctly', async () => {
      const output = await competitionsService.updateCompetitionResults(
        newFakeCompetitionEventsStub(),
        recordTypesStub(true),
      );

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

    it('updateCompetitionResults sets events correctly when there are no active record types', async () => {
      const output = await competitionsService.updateCompetitionResults(newFakeCompetitionEventsStub(), []);

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

      expect(singleRecord333fmResults.length).toBe(0);
      expect(avgRecord333fmResults.length).toBe(0);
      expect(output.events[0].rounds.length).toBe(3);
      expect(output.events[1].rounds.length).toBe(2);
    });
  });

  describe('setNewRecords works correctly', () => {
    it('sets new 3x3x3 BLD records from multiple same-day rounds correctly', () => {
      const sameDayRounds: IRound[] = [
        {
          competitionId: 'BLDTestComp2023',
          eventId: '333bf',
          date: new Date('2023-07-01T06:53:10Z'),
          roundTypeId: RoundType.First,
          format: RoundFormat.BestOf3,
          results: [
            {
              competitionId: 'BLDTestComp2023',
              eventId: '333bf',
              date: new Date('2023-07-01T06:53:10Z'),
              personId: '9',
              ranking: 1,
              attempts: [2202, 2960, 3037],
              best: 2202, // better than previous XWR, but not the best result of the day
              average: 2733, // better than previous XWR, but not the best result of the day
              regionalAverageRecord: 'XWR',
            },
            {
              competitionId: 'BLDTestComp2023',
              eventId: '333bf',
              date: new Date('2023-07-01T06:53:10Z'),
              personId: '8',
              ranking: 2,
              attempts: [2371, 2409, 2769],
              best: 2371,
              average: 2516, // better than previous XWR, but not the best result of the day
            },
            {
              competitionId: 'BLDTestComp2023',
              eventId: '333bf',
              date: new Date('2023-07-01T06:53:10Z'),
              personId: '7',
              ranking: 3,
              attempts: [-1, 4006, -1],
              best: 4006,
              average: -1,
            },
          ],
        },
        {
          competitionId: 'BLDTestComp2023',
          eventId: '333bf',
          date: new Date('2023-07-01T06:53:10Z'),
          roundTypeId: RoundType.Final,
          format: RoundFormat.BestOf3,
          results: [
            {
              competitionId: 'BLDTestComp2023',
              eventId: '333bf',
              date: new Date('2023-07-01T06:53:10Z'),
              personId: '8',
              ranking: 1,
              attempts: [2098, 2372, 2534],
              best: 2098, // new single XWR
              average: 2335, // new mean XWR
              regionalAverageRecord: 'XWR',
            },
            {
              competitionId: 'BLDTestComp2023',
              eventId: '333bf',
              date: new Date('2023-07-01T06:53:10Z'),
              personId: '9',
              ranking: 2,
              attempts: [3609, -1, 2940],
              best: 2940,
              average: -1,
            },
          ],
        },
      ];

      const records = { best: 2217, average: 2795 };
      const rounds = setNewRecords(sameDayRounds, records, 'XWR', true); // DO update records

      // Expect records object to be updated
      expect(records.best).toBe(2098);
      expect(records.average).toBe(2335);

      // Expect new records to be set, but only for the best results of the day
      expect(rounds[0].results.find((el) => el.regionalSingleRecord || el.regionalAverageRecord)).toBeUndefined();
      expect(rounds[1].results[0].regionalSingleRecord).toBe('XWR');
      expect(rounds[1].results[0].regionalAverageRecord).toBe('XWR');
      expect(rounds[1].results[1].regionalSingleRecord).toBeUndefined();
      expect(rounds[1].results[1].regionalAverageRecord).toBeUndefined();
    });

    it('sets new 3x3x3 FM records from multiple same-day rounds with ties correctly', () => {
      const sameDayRounds: IRound[] = [
        {
          competitionId: 'FMTestComp2023',
          eventId: '333fm',
          date: new Date('2023-07-01T06:53:10Z'),
          roundTypeId: RoundType.First,
          format: RoundFormat.Mean,
          results: [
            {
              competitionId: 'FMTestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-01T06:53:10Z'),
              personId: '9',
              ranking: 1,
              attempts: [44, 39, 46],
              best: 39, // XWR tied with the record and with another single in the finals
              average: 4300, // new XWR, but tied with another mean in the finals
              regionalAverageRecord: 'XWR',
            },
            {
              competitionId: 'FMTestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-01T06:53:10Z'),
              personId: '8',
              ranking: 2,
              attempts: [46, 47, 48],
              best: 47,
              average: 4700,
            },
            {
              competitionId: 'FMTestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-01T06:53:10Z'),
              personId: '7',
              ranking: 3,
              attempts: [44, -1, -2],
              best: 44,
              average: -1,
            },
          ],
        },
        {
          competitionId: 'FMTestComp2023',
          eventId: '333fm',
          date: new Date('2023-07-01T06:53:10Z'),
          roundTypeId: RoundType.Final,
          format: RoundFormat.Mean,
          results: [
            {
              competitionId: 'FMTestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-01T06:53:10Z'),
              personId: '8',
              ranking: 1,
              attempts: [41, 43, 45],
              best: 41,
              average: 4300, // new XWR, but tied with another mean in the first round
              regionalAverageRecord: 'XWR',
            },
            {
              competitionId: 'FMTestComp2023',
              eventId: '333fm',
              date: new Date('2023-07-01T06:53:10Z'),
              personId: '9',
              ranking: 2,
              attempts: [39, -1, -2],
              best: 39, // XWR tied with the record and with another single in the first round
              average: -1,
            },
          ],
        },
      ];

      const records = { best: 39, average: 4600 };
      const rounds = setNewRecords(sameDayRounds, records, 'XWR', true); // DO update records

      // Expect records object to be updated
      expect(records.best).toBe(39);
      expect(records.average).toBe(4300);

      expect(rounds[0].results[0].regionalAverageRecord).toBe('XWR');
      expect(rounds[0].results[0].regionalSingleRecord).toBe('XWR');
      expect(rounds[1].results[0].regionalSingleRecord).toBeUndefined();
      expect(rounds[1].results[0].regionalAverageRecord).toBe('XWR');
      expect(rounds[1].results[1].regionalSingleRecord).toBe('XWR');
      expect(rounds[1].results[1].regionalAverageRecord).toBeUndefined();
    });
  });
});
