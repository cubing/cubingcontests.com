import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CompetitionsService } from '../competitions.service';
import { EventsService } from '@m/events/events.service';
import { ResultsService } from '@m/results/results.service';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { PersonsService } from '@m/persons/persons.service';
import { IResult, IRound } from '@sh/interfaces';
import { UpdateCompetitionDto } from '../dto/update-competition.dto';
import { setNewRecords } from '@sh/sharedFunctions';
import { Role, WcaRecordType } from '@sh/enums';

// Mocks and stubs
import { EventsServiceMock } from '@m/events/tests/mocks/events.service';
import { ResultsServiceMock } from '@m/results/tests/mocks/results.service';
import { RecordTypesServiceMock } from '@m/record-types/tests/mocks/record-types.service';
import { PersonsServiceMock } from '@m/persons/tests/mocks/persons.service';
import { mockCompetitionModel } from './mocks/competition.model';
import { mockRoundModel } from './mocks/round.model';
import { mockResultModel } from '@m/results/tests/mocks/result.model';
import { recordTypesStub } from '@m/record-types/tests/stubs/record-types.stub';
import { activeRecordTypesStub } from '@m/record-types/tests/stubs/active-record-types.stub';
import { newCompetitionEventsStub, newFakeCompetitionEventsStub } from './stubs/new-competition-events.stub';
import { sameDayBLDRoundsStub, sameDayFMRoundsStub } from './stubs/same-day-rounds.stub';

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

  describe('Endpoints', () => {
    it('should get full competition', async () => {
      const { competition, persons } = await competitionsService.getCompetition('Munich19022023');

      expect(competition.name).toBe('Meetup in Munich on February 19, 2023');
      expect(competition.events.length).toBe(4);
      expect(persons.length).toBe(4);
    });

    it('should get full moderator competition', async () => {
      const { competition, persons, records } = await competitionsService.getModCompetition('Munich14062023', mockUser);

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
      competitionsService.postResults('Munich30062023', updateCompetitionDto, mockUser);
    });

    it('should update competition results without error', () => {
      const updateCompetitionDto = { events: newCompetitionEventsStub() } as UpdateCompetitionDto;
      competitionsService.postResults('Munich27062023', updateCompetitionDto, mockUser);
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

      expect(sameDayRounds[0].results[0].regionalAverageRecord).toBe('WR');
      expect(sameDayRounds[0].results[0].regionalSingleRecord).toBe('WR');
    });

    it('sets new 3x3x3 FM records with multiple record-breaking results on the same day correctly', async () => {
      const records: any = await competitionsService.getEventRecords('333fm', activeRecordTypesStub());

      expect(records.WR.best).toBe(39);
      expect(records.WR.average).toBe(4600);

      const sameDayRounds = newCompetitionEventsStub()[1].rounds;
      await competitionsService.setRecordsAndSaveResults(sameDayRounds, activeRecordTypesStub(), records);

      expect(sameDayRounds[0].results[0].regionalSingleRecord).toBeUndefined();
      expect(sameDayRounds[0].results[0].regionalAverageRecord).toBe('WR');
      expect(sameDayRounds[0].results[2].regionalSingleRecord).toBe('WR');
    });

    it('sets new 3x3x3 FM records with ties correctly', async () => {
      const records: any = await competitionsService.getEventRecords('333fm', activeRecordTypesStub());

      const sameDayRounds = [newFakeCompetitionEventsStub()[0].rounds[0]];
      await competitionsService.setRecordsAndSaveResults(sameDayRounds, activeRecordTypesStub(), records);

      expect(sameDayRounds[0].results[0].regionalSingleRecord).toBe('WR');
      expect(sameDayRounds[0].results[0].regionalAverageRecord).toBe('WR');
      expect(sameDayRounds[0].results[1].regionalSingleRecord).toBe('WR');
      expect(sameDayRounds[0].results[1].regionalAverageRecord).toBeUndefined();
    });

    it('sets multiple 2x2x2 records set in different rounds on the same day correctly', async () => {
      const records: any = await competitionsService.getEventRecords('222', activeRecordTypesStub());

      expect(records.WR.best).toBe(153);
      expect(records.WR.average).toBe(337);

      const sameDayRounds = newFakeCompetitionEventsStub()[1].rounds;
      await competitionsService.setRecordsAndSaveResults(sameDayRounds, activeRecordTypesStub(), records);

      // The single here is also better than WR, but it should not be set,
      // because the next round has an even better single
      expect(sameDayRounds[0].results[0].regionalSingleRecord).toBeUndefined();
      expect(sameDayRounds[0].results[0].regionalAverageRecord).toBeUndefined();
      expect(sameDayRounds[1].results[0].regionalSingleRecord).toBe('WR');
      expect(sameDayRounds[1].results[0].regionalAverageRecord).toBe('WR');
    });

    it('updateCompetitionResults sets events and participants correctly', async () => {
      const output = await competitionsService.updateCompetitionResults(newCompetitionEventsStub(), recordTypesStub());
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
      // 6.86 single and 8.00 average WRs
      expect(output.events[0].rounds[0].results[0].regionalSingleRecord).toBe('WR');
      expect(output.events[0].rounds[0].results[0].best).toBe(686);
      expect(output.events[0].rounds[0].results[0].regionalAverageRecord).toBe('WR');
      // 32 single and 35.67 mean WRs
      expect(output.events[1].rounds[0].results[2].regionalSingleRecord).toBe('WR');
      expect(output.events[1].rounds[0].results[0].regionalAverageRecord).toBe('WR');
    });

    it('updateCompetitionResults sets events with multiple rounds on multiple days correctly', async () => {
      const output = await competitionsService.updateCompetitionResults(
        newFakeCompetitionEventsStub(),
        recordTypesStub(),
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
      // 29 single x2 and 31.00 mean WRs
      expect(output.events[0].rounds[0].results[0].regionalSingleRecord).toBe('WR');
      expect(output.events[0].rounds[0].results[1].regionalSingleRecord).toBe('WR');
      expect(output.events[0].rounds[0].results[0].regionalAverageRecord).toBe('WR');
      // 28 single and 29.33 mean WRs
      expect(output.events[0].rounds[1].results[0].regionalSingleRecord).toBe('WR');
      expect(output.events[0].rounds[1].results[0].regionalAverageRecord).toBe('WR');
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
      const sameDayRounds: IRound[] = sameDayBLDRoundsStub();

      const records = { best: 2217, average: 2795 };
      const rounds = setNewRecords(sameDayRounds, records, WcaRecordType.WR, true); // DO update records

      // Expect records object to be updated
      expect(records.best).toBe(2098);
      expect(records.average).toBe(2335);

      // Expect new records to be set, but only for the best results of the day
      expect(rounds[0].results.find((el) => el.regionalSingleRecord || el.regionalAverageRecord)).toBeUndefined();
      expect(rounds[1].results[0].regionalSingleRecord).toBe('WR');
      expect(rounds[1].results[0].regionalAverageRecord).toBe('WR');
      expect(rounds[1].results[1].regionalSingleRecord).toBeUndefined();
      expect(rounds[1].results[1].regionalAverageRecord).toBeUndefined();
    });

    it('sets new 3x3x3 FM records from multiple same-day rounds with ties correctly', () => {
      const sameDayRounds: IRound[] = sameDayFMRoundsStub();

      const records = { best: 39, average: 4600 };
      const rounds = setNewRecords(sameDayRounds, records, WcaRecordType.WR, true); // DO update records

      // Expect records object to be updated
      expect(records.best).toBe(39);
      expect(records.average).toBe(4300);

      expect(rounds[0].results[0].regionalAverageRecord).toBe('WR');
      expect(rounds[0].results[0].regionalSingleRecord).toBe('WR');
      expect(rounds[1].results[0].regionalSingleRecord).toBeUndefined();
      expect(rounds[1].results[0].regionalAverageRecord).toBe('WR');
      expect(rounds[1].results[1].regionalSingleRecord).toBe('WR');
      expect(rounds[1].results[1].regionalAverageRecord).toBeUndefined();
    });
  });
});
