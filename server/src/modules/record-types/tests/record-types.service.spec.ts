import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RecordTypesService } from '../record-types.service';
import { mockRoundModel } from '@m/competitions/tests/__mocks__/round.model';
import { mockRecordTypeModel } from './__mocks__/record-type.model';
import { Model } from 'mongoose';
import { RoundDocument } from '~/src/models/round.model';
import { RecordTypeDocument } from '~/src/models/record-type.model';

describe('RecordTypesService', () => {
  let recordTypesService: RecordTypesService;
  let roundModel: Model<RoundDocument>;
  let recordTypeModel: Model<RecordTypeDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordTypesService,
        {
          provide: getModelToken('Round'),
          useValue: mockRoundModel,
        },
        {
          provide: getModelToken('RecordType'),
          useValue: mockRecordTypeModel,
        },
      ],
    }).compile();

    recordTypesService = module.get<RecordTypesService>(RecordTypesService);
    roundModel = module.get<Model<RoundDocument>>(getModelToken('Round'));
    recordTypeModel = module.get<Model<RecordTypeDocument>>(getModelToken('RecordType'));
  });

  it('should be defined', () => {
    expect(recordTypesService).toBeDefined();
  });

  it.skip('should set records when they are activated', () => {
    // const
  });
});
