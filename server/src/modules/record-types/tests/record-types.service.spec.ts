import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { mockEventModel } from "@m/events/tests/mocks/event.model";
import { MyLogger } from "@m/my-logger/my-logger.service";
import { RecordTypesService } from "../record-types.service";
import { MyLoggerMock } from "@m/my-logger/tests/my-logger.service";
import { RecordTypeModelMock } from "./mocks/record-type.model";
import { ResultModelMock } from "@m/results/tests/mocks/result.model";
import { recordTypesStub } from "./stubs/record-types.stub";

describe("RecordTypesService", () => {
  let recordTypesService: RecordTypesService;
  // let resultModel: Model<ResultDocument>;
  // let recordTypeModel: Model<RecordTypeDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordTypesService,
        {
          provide: MyLogger,
          useFactory: MyLoggerMock,
        },
        {
          provide: getModelToken("Result"),
          useFactory: ResultModelMock,
        },
        {
          provide: getModelToken("Event"),
          useFactory: mockEventModel,
        },
        {
          provide: getModelToken("RecordType"),
          useFactory: RecordTypeModelMock,
        },
      ],
    }).compile();

    recordTypesService = module.get<RecordTypesService>(RecordTypesService);
    // resultModel = module.get<Model<ResultDocument>>(getModelToken('Result'));
    // recordTypeModel = module.get<Model<RecordTypeDocument>>(getModelToken('RecordType'));
  });

  it("should be defined", () => {
    expect(recordTypesService).toBeDefined();
  });

  it("should set records when they are activated without error", async () => {
    await recordTypesService.updateRecordTypes(recordTypesStub());
  });
});
