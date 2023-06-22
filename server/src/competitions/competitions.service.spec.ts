import { Test, TestingModule } from '@nestjs/testing';
import { CompetitionsService } from './competitions.service';

describe('ContestsService', () => {
  let service: CompetitionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompetitionsService],
    }).compile();

    service = module.get<CompetitionsService>(CompetitionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
