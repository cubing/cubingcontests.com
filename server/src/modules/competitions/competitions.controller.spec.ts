import { Test, TestingModule } from '@nestjs/testing';
import { CompetitionsController } from './competitions.controller';

describe('ContestsController', () => {
  let controller: CompetitionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompetitionsController],
    }).compile();

    controller = module.get<CompetitionsController>(CompetitionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
