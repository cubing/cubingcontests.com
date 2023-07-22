import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EventsService } from '@m/events/events.service';
import { ResultsService } from '@m/results/results.service';
import { RecordTypesService } from '@m/record-types/record-types.service';
import { PersonsService } from '@m/persons/persons.service';
import { WcaRecordType } from '@sh/enums';

// Mocks and stubs
import { EventsServiceMock } from '@m/events/tests/mocks/events.service';
import { RecordTypesServiceMock } from '@m/record-types/tests/mocks/record-types.service';
import { PersonsServiceMock } from '@m/persons/tests/mocks/persons.service';
import { mockResultModel } from '@m/results/tests/mocks/result.model';
import { IEventRecords } from '@sh/interfaces';

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
          provide: getModelToken('Result'),
          useFactory: mockResultModel,
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
      expect(records333.bestRecords.length).toBe(1);
      expect(records333.bestRecords[0].result.best).toBe(909);
      expect(records333.averageRecords.length).toBe(1);
      expect(records333.averageRecords[0].result.average).toBe(1132);
      // Check 3x3x3 FM records (they should have a tie)
      expect(records333fm.bestRecords.length).toBe(2);
      expect(records333fm.bestRecords[0].result.best).toBe(39);
      expect(records333fm.bestRecords[1].result.best).toBe(39);
      expect(records333fm.averageRecords.length).toBe(1);
      expect(records333fm.averageRecords[0].result.average).toBe(4600);
    });
  });
});
