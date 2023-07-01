import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RecordTypesService } from '../record-types.service';
import { mockResultModel } from '@m/competitions/tests/__mocks__/result.model';
import { mockRecordTypeModel } from './__mocks__/record-type.model';
import { Model } from 'mongoose';
import { ResultDocument } from '~/src/models/result.model';
import { RecordTypeDocument } from '~/src/models/record-type.model';

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
          useValue: mockResultModel,
        },
        {
          provide: getModelToken('Event'),
          useValue: {},
        },
        {
          provide: getModelToken('RecordType'),
          useValue: mockRecordTypeModel,
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

  // it('should set records when they are activated', () => {
  //   const
  // });
});
