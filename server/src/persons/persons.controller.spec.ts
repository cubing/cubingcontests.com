import { Test, TestingModule } from '@nestjs/testing';
import { PersonsController } from './persons.controller';

describe('PersonsController', () => {
  let controller: PersonsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonsController],
    }).compile();

    controller = module.get<PersonsController>(PersonsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
