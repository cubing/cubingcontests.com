import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EventsService } from '@m/events/events.service';
import { ResultsService } from '@m/results/results.service';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { PersonsService } from '@m/persons/persons.service';
import { CompetitionsService } from '@m/competitions/competitions.service';
import { WcaRecordType } from '@sh/enums';
import { IEventRecords } from '@sh/interfaces';

// Mocks and stubs
import { EventsServiceMock } from '@m/events/tests/mocks/events.service';
import { RecordTypesServiceMock } from '@m/record-types/tests/mocks/record-types.service';
import { PersonsServiceMock } from '@m/persons/tests/mocks/persons.service';
import { ResultModelMock } from '@m/results/tests/mocks/result.model';
import { CompetitionModelMock } from '@m/competitions/tests/mocks/competition.model';

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
          provide: getModelToken('Competition'),
          useFactory: CompetitionModelMock,
        },
        {
          provide: getModelToken('Result'),
          useFactory: ResultModelMock,
        },
      ],
    }).compile();

    resultsService = module.get<ResultsService>(ResultsService);
  });

  describe('Endpoints', () => {
    it('should get current records', async () => {
      const eventRecords = await resultsService.getRecords(WcaRecordType.WR);
      const records333 = eventRecords.find((el: IEventRecords) => el.event.eventId === '333');
      const records333fm = eventRecords.find((el: IEventRecords) => el.event.eventId === '333fm');

      // Check 3x3x3 records
      expect(records333.records.length).toBe(2);
      expect(records333.records[0].result.best).toBe(909);
      expect(records333.records[1].result.average).toBe(1132);
      // Check 3x3x3 FM records (they should have a tie)
      expect(records333fm.records.length).toBe(3);
      expect(records333fm.records[0].result.best).toBe(39);
      expect(records333fm.records[1].result.best).toBe(39);
      expect(records333fm.records[2].result.average).toBe(4600);
    });
  });
});
