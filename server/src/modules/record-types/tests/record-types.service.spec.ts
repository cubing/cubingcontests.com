import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RecordTypesService } from '../record-types.service';
import { ResultModelMock } from '@m/results/tests/mocks/result.model';
import { RecordTypeModelMock } from './mocks/record-type.model';
import { Model } from 'mongoose';
import { ResultDocument } from '~/src/models/result.model';
import { RecordTypeDocument } from '~/src/models/record-type.model';
import { recordTypesStub } from './stubs/record-types.stub';
import { mockEventModel } from '../../events/tests/mocks/event.model';

describe('RecordTypesService', () => {
  let recordTypesService: RecordTypesService;
  let resultModel: Model<ResultDocument>;
  let recordTypeModel: Model<RecordTypeDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordTypesService,
        {
          provide: getModelToken('Result'),
          useFactory: ResultModelMock,
        },
        {
          provide: getModelToken('Event'),
          useFactory: mockEventModel,
        },
        {
          provide: getModelToken('RecordType'),
          useFactory: RecordTypeModelMock,
        },
      ],
    }).compile();

    recordTypesService = module.get<RecordTypesService>(RecordTypesService);
    resultModel = module.get<Model<ResultDocument>>(getModelToken('Result'));
    recordTypeModel = module.get<Model<RecordTypeDocument>>(getModelToken('RecordType'));
  });

  it('should be defined', () => {
    expect(recordTypesService).toBeDefined();
  });

  it('should set records when they are activated without error', async () => {
    await recordTypesService.updateRecordTypes(recordTypesStub());
  });
});
